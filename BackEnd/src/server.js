
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import router from "./routes/routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ==================================
// CORS: FRONTEND LOCAL Y PRODUCCIÓN
// ==================================

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map(url => url.trim())
    .filter(Boolean)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin Origin (por ejemplo, herramientas de servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
};

// ==================================
// SOCKET.IO
// ==================================

const io = new Server(server, {
  cors: corsOptions
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado a Socket.IO:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// ==================================
// MIDDLEWARES
// ==================================

app.use(cors(corsOptions));
app.use(express.json());

// ==================================
// RUTAS
// ==================================

app.use("/api", router);

// ==================================
// INICIAR SERVIDOR
// ==================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🔥 Server running on port ${PORT}`);
      console.log("⚡ Socket.IO funcionando");
      console.log("🌐 Orígenes permitidos:", allowedOrigins);
    });

  } catch (error) {
    console.error("💥 Error iniciando server:", error);
    process.exit(1);
  }
};

startServer();
