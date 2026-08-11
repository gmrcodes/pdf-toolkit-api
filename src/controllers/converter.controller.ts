import { Context } from "hono";
import JSZip from "jszip";
import { ConverterService } from "../services/converter.service.ts";

export class ConverterController {
  static async convertWordToPdf(c: Context) {
    let tempDir = "";

    try {
      // Parsear los archivos subidos individual o lote
      const body = await c.req.parseBody({ all: true });
      const filesInput = body["files"] || body["files[]"];

      if (!filesInput) {
        return c.json({
          error: "No se adjuntó ningún archivo. Usa el campo 'files'.",
        }, 400);
      }

      // Normalizar a un Array de objetos File
      const fileList: File[] = Array.isArray(filesInput)
        ? (filesInput as File[])
        : [filesInput as File];

      // Filtrar solo documentos de Word válidos
      const validFiles = fileList.filter(
        (file) =>
          file instanceof File &&
          (file.name.endsWith(".doc") || file.name.endsWith(".docx")),
      );

      if (validFiles.length === 0) {
        return c.json({
          error:
            "Ninguno de los archivos adjuntos es un formato .doc o .docx válido.",
        }, 400);
      }

      // Crear directorio temporal aislado para esta petición
      tempDir = await Deno.makeTempDir({ prefix: "converter_pdf_" });
      const inputPaths: string[] = [];

      // Escribir los archivos en el sistema de archivos temporal
      for (const file of validFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const filePath = `${tempDir}/${file.name}`;
        await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));
        inputPaths.push(filePath);
      }

      // Ejecutar conversión mediante el servicio
      const pdfPaths = await ConverterService.convertBatch(inputPaths, tempDir);

      // Si es un solo archivo, lo devolvemos directamente para descarga
      if (pdfPaths.length === 1) {
        const pdfBytes = await Deno.readFile(pdfPaths[0]);
        const pdfFileName = pdfPaths[0].split("/").pop()?.split("\\").pop() ??
          "convertido.pdf";

        // Limpiar directorio temporal
        await Deno.remove(tempDir, { recursive: true }).catch(() => {});

        return new Response(pdfBytes as unknown as BodyInit, {
          status:200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfFileName}"`,
          },
        });
      }

      // Si es un lote de archivos, empaqueta en ZIP
      const zip = new JSZip();

      for (const pdfPath of pdfPaths){
        const pdfBytes = await Deno.readFile(pdfPath);
        const fileName = pdfPath.split("/").pop()?.split("\\").pop() ?? "archivo.pdf";
        zip.file(fileName, pdfBytes);
      }

      const zipBuffer = await zip.generateAsync({type: "uint8array"});
      // Limpiar directorio temporal
      await Deno.remove(tempDir, { recursive: true }).catch(() => {});

      return new Response(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="documentos_convertidos.zip"',
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
