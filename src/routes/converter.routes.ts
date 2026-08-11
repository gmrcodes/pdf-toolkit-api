import { Hono } from "hono";
import { ConverterController } from "../controllers/converter.controller.ts";

const converterRoutes = new Hono();

converterRoutes.post("/word-to-pdf", ConverterController.convertWordToPdf);

export { converterRoutes };
