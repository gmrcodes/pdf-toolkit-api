import { Context } from "hono";
import { PdfService } from "../services/pdf.service.ts";

export class PdfController {
  // POST /api/v1/pdf/merge
  static async merge(c: Context) {
    try {
      const body = await c.req.parseBody({ all: true });
      const filesInput = body["files"] || body["files[]"];

      if (!filesInput || !Array.isArray(filesInput)) {
        return c.json(
          {
            error:
              "Debes adjuntar al menos 2 archivos PDF en el campo 'files'.",
          },
          400,
        );
      }

      const files = filesInput as File[];
      if (files.length < 2) {
        return c.json({
          error: "Se requieren mínimo 2 archivos para combinar.",
        }, 400);
      }

      const pdfBuffers: Uint8Array[] = [];
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          return c.json({
            error: `El archivo ${file.name} no es un PDF válido.`,
          }, 400);
        }
        const buffer = new Uint8Array(await file.arrayBuffer());
        pdfBuffers.push(buffer);
      }

      const mergedPdfBytes = await PdfService.mergePdfs(pdfBuffers);

      // Obtener el nombre del primer archivo sin extensión
      const firstNameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
      const outputFileName = `${firstNameWithoutExt}_combinado.pdf`;

      return new Response(mergedPdfBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${outputFileName}"`,
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return c.json({ error: errorMsg }, 500);
    }
  }

  // POST /api/v1/pdf/split
  static async split(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body["file"] as File;
      const startPage = parseInt(body["startPage"] as string, 10);
      const endPage = parseInt(body["endPage"] as string, 10);

      if (
        !file || !(file instanceof File) ||
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        return c.json({
          error: "Debes adjuntar un archivo PDF en el campo 'file'.",
        }, 400);
      }

      if (isNaN(startPage) || isNaN(endPage)) {
        return c.json(
          {
            error:
              "Debes indicar 'startPage' y 'endPage' como números válidos.",
          },
          400,
        );
      }

      const pdfBytes = new Uint8Array(await file.arrayBuffer());
      const splitPdfBytes = await PdfService.splitPdf(
        pdfBytes,
        startPage,
        endPage,
      );

      // Obtener el nombre del archivo original sin extensión
      const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const outputFileName =
        `${originalNameWithoutExt}_${startPage}_a_${endPage}.pdf`;

      return new Response(splitPdfBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${outputFileName}"`,
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return c.json({ error: errorMsg }, 500);
    }
  }

  // POST /api/v1/pdf/unlock
  static async unlock(c: Context) {
    let tempDir = "";
    try {
      const body = await c.req.parseBody();
      const file = body["file"] as File;
      const password = (body["password"] as string) || "";

      if (
        !file || !(file instanceof File) ||
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        return c.json({
          error: "Debes adjuntar un archivo PDF en el campo 'file'.",
        }, 400);
      }

      if (!password) {
        return c.json({
          error: "Debes proporcionar la contraseña en el campo 'password'.",
        }, 400);
      }

      // Crear carpeta temporal
      tempDir = await Deno.makeTempDir({ prefix: "unlock_pdf_" });
      const inputPath = `${tempDir}/protected.pdf`;
      const outputPath = `${tempDir}/unlocked.pdf`;

      // Guardar el archivo temporalmente
      const buffer = new Uint8Array(await file.arrayBuffer());
      await Deno.writeFile(inputPath, buffer);

      // Desbloquear
      await PdfService.unlockPdf(inputPath, outputPath, password);

      // Leer el resultado generado
      const unlockedBytes = await Deno.readFile(outputPath);
      const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const outputFileName = `${originalNameWithoutExt}_desbloqueado.pdf`;

      // Limpiar carpeta temporal
      await Deno.remove(tempDir, { recursive: true }).catch(() => {});

      return new Response(unlockedBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${outputFileName}"`,
        },
      });
    } catch (err) {
      if (tempDir) {
        await Deno.remove(tempDir, { recursive: true }).catch(() => {});
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      return c.json({ error: errorMsg }, 500);
    }
  }
}
