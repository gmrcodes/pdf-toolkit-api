import { runCommand } from "../utils/exec.util.ts";

export class ConverterService {
  /**
   * Convierte un archivo (.doc/.docx) a PDF.
   * @param inputPath Ruta absoluta o relativa al archivo de origen.
   * @param outputDir Directorio donde se guardará el PDF resultante.
   */
  static async convertWordToPdf(
    inputPath: string,
    outputDir: string,
  ): Promise<string> {
    const result = await runCommand("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ]);

    if (!result.success) {
      throw new Error(`Falló la conversión de word a PDF: ${result.error}`);
    }

    // Guardar el PDF creado con el mismo nombre del Word
    const fileNameWithoutExt =
      inputPath.split("/").pop()?.split("\\").pop()?.replace(/\.[^/.]+$/, "") ??
        "documento";
    return `${outputDir}/${fileNameWithoutExt}.pdf`;
  }

  /**
   * Convierte un lote de archivos Word a PDF simultáneamente.
   * @param inputPaths Lista de rutas de los archivos Word
   * @param outputDir Directorio donde se guardarán los PDFs
   */
  static async convertBatch(
    inputPaths: string[],
    outputDir: string,
  ): Promise<string[]> {
    if (inputPaths.length === 0) return [];

    // LibreOffice acepta múltiples rutas como argumentos finales
    const result = await runCommand("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      ...inputPaths,
    ]);

    if (!result.success) {
      throw new Error(`Falló la conversión masiva: ${result.error}`);
    }

    // Retorna las rutas de todos los PDFs generados
    return inputPaths.map((path) => {
      const fileNameWithoutExt =
        path.split("/").pop()?.split("\\").pop()?.replace(/\.[^/.]+$/, "") ??
          "documento";
      return `${outputDir}/${fileNameWithoutExt}.pdf`;
    });
  }
}
