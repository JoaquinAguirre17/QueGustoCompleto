import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import router from "./routes/routes.js"; // 👈 IMPORTANTE

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

/* =========================
   RUTAS
========================= */
app.use("/api", router); // 🔥 CLAVE

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    await connectDB();

    app.listen(3000, () => {
      console.log("🔥 Server running on port 3000");
    });

  } catch (error) {
    console.log("💥 Error iniciando server:", error);
  }
};

startServer();