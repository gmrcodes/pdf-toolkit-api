import { Hono } from "hono";
import {cors} from "hono/cors";
import { converterRoutes } from "./routes/converter.routes.ts";
import { pdfRoutes } from "./routes/pdf.routes.ts";

const app = new Hono();

// Middleware CORS global
app.use("*", cors());

app.get("/", (c) => {
  return c.json({
    status: "online",
    message: "SaaS PDF Engine API activa",
    os: Deno.build.os,
  });
});

// Registrar modulo de la API
app.route("/api/v1/convert", converterRoutes);
app.route("/api/v1/pdf", pdfRoutes);

Deno.serve({ port: 8000 }, app.fetch);
