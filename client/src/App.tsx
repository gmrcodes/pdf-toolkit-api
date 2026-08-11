import React, { useState } from "react";
import {
  AlertCircle,
  Combine,
  FileText,
  Loader2,
  LockKeyhole,
  Scissors,
  UploadCloud,
} from "lucide-react";

type ActiveTab = "convert" | "merge" | "split" | "unlock";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("convert");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Campos específicos de operaciones
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [password, setPassword] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setError(null);
    }
  };

  const handleDownload = (
    blob: Blob,
    defaultFilename: string,
    response: Response,
  ) => {
    // Intentar extraer el nombre del archivo desde el header Content-Disposition
    const disposition = response.headers.get("Content-Disposition");
    let filename = defaultFilename;

    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError("Por favor selecciona al menos un archivo.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();

    try {
      let endpoint = "";
      let defaultFileName = "resultado.pdf";

      if (activeTab === "convert") {
        endpoint = "/api/v1/convert/word-to-pdf";
        Array.from(files).forEach((file) => formData.append("files", file));
        defaultFileName =
          files.length > 1 ? "documentos_convertidos.zip" : "convertido.pdf";
      } else if (activeTab === "merge") {
        endpoint = "/api/v1/pdf/merge";
        Array.from(files).forEach((file) => formData.append("files", file));
        defaultFileName = "pdf_combinado.pdf";
      } else if (activeTab === "split") {
        endpoint = "/api/v1/pdf/split";
        formData.append("file", files[0]);
        formData.append("startPage", startPage.toString());
        formData.append("endPage", endPage.toString());
        defaultFileName = `dividido_${startPage}_a_${endPage}.pdf`;
      } else if (activeTab === "unlock") {
        endpoint = "/api/v1/pdf/unlock";
        formData.append("file", files[0]);
        formData.append("password", password);
        defaultFileName = "desbloqueado.pdf";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({
          error: "Error desconocido",
        }));
        throw new Error(errData.error || `Error HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      handleDownload(blob, defaultFileName, response);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al procesar la solicitud";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">
            PDF Toolkit Studio
          </h1>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center">
        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab("convert");
              setFiles(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              activeTab === "convert"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" /> Word a PDF
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("merge");
              setFiles(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              activeTab === "merge"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Combine className="w-4 h-4" /> Unir PDFs
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("split");
              setFiles(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              activeTab === "split"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Scissors className="w-4 h-4" /> Dividir PDF
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("unlock");
              setFiles(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              activeTab === "unlock"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <LockKeyhole className="w-4 h-4" /> Desbloquear
          </button>
        </div>

        {/* TARJETA DE ACCIÓN */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zona Dropzone / Carga de Archivos */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {activeTab === "convert" &&
                  "Selecciona documento(s) Word (.doc, .docx)"}
                {activeTab === "merge" && "Selecciona al menos 2 archivos PDF"}
                {activeTab === "split" && "Selecciona el archivo PDF a dividir"}
                {activeTab === "unlock" &&
                  "Selecciona el PDF protegido con contraseña"}
              </label>

              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-900/40 transition cursor-pointer">
                <input
                  type="file"
                  multiple={activeTab === "convert" || activeTab === "merge"}
                  accept={activeTab === "convert" ? ".doc,.docx" : ".pdf"}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    {files && files.length > 0
                      ? `${files.length} archivo(s) seleccionado(s)`
                      : "Haz clic para subir o arrastra los archivos aquí"}
                  </span>
                </div>
              </div>
            </div>

            {/* Opciones específicas según pestaña */}
            {activeTab === "split" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Página Inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={(e) =>
                      setStartPage(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Página Final
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={endPage}
                    onChange={(e) =>
                      setEndPage(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "unlock" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Contraseña del PDF
                </label>
                <input
                  type="password"
                  placeholder="Escribe la clave del documento"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                </>
              ) : (
                "Ejecutar Operación"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Créditos y Licencia */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Construido con{" "}
            <span className="text-slate-200 font-medium">Deno</span>,{" "}
            <span className="text-slate-200 font-medium">Hono</span>,{" "}
            <span className="text-slate-200 font-medium">React</span> &{" "}
            <span className="text-slate-200 font-medium">Tailwind CSS</span>.
          </p>
          <p>
            Licencia libre bajo{" "}
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline font-medium transition"
            >
              GNU GPLv3
            </a>
          </p>
        </div>
        <p className="text-slate-500 pt-2 border-t border-slate-800/50">
          Desarrollado por{" "}
          <a
            href="https://github.com/gmrcodes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-200 hover:text-indigo-400 font-medium transition underline"
          >
            gmrCodes
          </a>
        </p>
      </footer>
    </div>
  );
}
