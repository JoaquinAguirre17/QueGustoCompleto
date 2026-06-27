import express from "express";
import cors from "cors";

import routes from "./routes/routes.js";

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(cors());

app.use(express.json());

/* =========================
   RUTAS API
========================= */

app.use("/api", routes);

/* =========================
   TEST API
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "Que Gusto API"
  });
});

export default app;