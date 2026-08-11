import { PDFDocument } from "pdf-lib";
import { runCommand } from "../utils/exec.util.ts";

export class PdfService {
  /**
   * Combina archivos PDF en un único documento.
   * @param pdfBuffers Array de buffers de los archivos PDF
   * @returns Array con el PDF combinado final
   */
  static async mergePdfs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBytes of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Divide un PDF extrayendo un rango de páginas específico.
   * @param pdfBytes Buffer del PDF original
   * @param startPage Página inicial (base 1)
   * @param endPage Página final (base 1)
   */
  static async splitPdf(
    pdfBytes: Uint8Array,
    startPage: number,
    endPage: number,
  ): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const totalPages = srcDoc.getPageCount();

    if (startPage < 1 || endPage > totalPages || startPage > endPage) {
      throw new Error(
        `Rango inválido. El documento tiene ${totalPages} página(s).`,
      );
    }

    const newPdf = await PDFDocument.create();

    // Convertir a índices de array (base 0)
    const pageIndices: number[] = [];
    for (let i = startPage - 1; i < endPage; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Remueve la contraseña de un archivo PDF usando QPDF.
   * @param inputPath Ruta del PDF encriptado
   * @param outputPath Ruta del PDF desbloqueado
   * @param password Contraseña del PDF
   */
  static async unlockPdf(
    inputPath: string,
    outputPath: string,
    password: string,
  ): Promise<void> {
    const result = await runCommand("qpdf", [
      `--password=${password}`,
      "--decrypt",
      inputPath,
      outputPath,
    ]);

    if (!result.success) {
      throw new Error(
        "No se pudo desbloquear el PDF. Verifica que la contraseña ingresada sea correcta.",
      );
    }
  }
}
