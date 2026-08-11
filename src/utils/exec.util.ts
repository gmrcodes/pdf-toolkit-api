export interface ProcessResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function runCommand(
  cmd: string,
  args: string[],
): Promise<ProcessResult> {
  try {
    const command = new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await command.output();
    const decoder = new TextDecoder();

    if (!success) {
      return {
        success: false,
        output: decoder.decode(stdout),
        error: decoder.decode(stderr) ||
          "Error desconocido al ejecutar el proceso.",
      };
    }
    return {
      success: true,
      output: decoder.decode(stdout),
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: "",
      error:
        `No se pudo ejecutar el comando '${cmd}': ${errorMsg}. Verifica que LibreOffice esté instalado y en el PATH.`,
    };
  }
}
