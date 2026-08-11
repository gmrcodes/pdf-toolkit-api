import { Hono } from "hono";
import { PdfController } from "../controllers/pdf.controller.ts";

const pdfRoutes = new Hono();

pdfRoutes.post("/merge", PdfController.merge);
pdfRoutes.post("/split", PdfController.split);
pdfRoutes.post("/unlock", PdfController.unlock);

export { pdfRoutes };
