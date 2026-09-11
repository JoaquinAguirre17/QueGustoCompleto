
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import router from "./routes/routes.js";

dotenv.config();

const app = express();


/* =========================
   SERVIDOR HTTP
========================= */

const server = http.createServer(app);


/* =========================
   SOCKET.IO
========================= */

const io = new Server(server, {

  cors: {

    origin: "http://localhost:5173",

    methods: [
      "GET",
      "POST"
    ],

    credentials: true

  }

});


/* =========================
   HACER IO DISPONIBLE
   EN LOS CONTROLADORES
========================= */

app.set("io", io);


/* =========================
   SOCKET CONNECTION
========================= */

io.on("connection", (socket) => {

  console.log(
    "🟢 Cliente conectado a Socket.IO:",
    socket.id
  );


  socket.on("disconnect", () => {

    console.log(
      "🔴 Cliente desconectado:",
      socket.id
    );

  });

});


/* =========================
   MIDDLEWARES
========================= */

app.use(

  cors({

    origin: "http://localhost:5173",

    credentials: true

  })

);


app.use(
  express.json()
);


/* =========================
   RUTAS
========================= */

app.use(
  "/api",
  router
);


/* =========================
   START SERVER
========================= */

const startServer = async () => {

  try {

    await connectDB();


    server.listen(
      3000,
      () => {

        console.log(
          "🔥 Server running on port 3000"
        );

        console.log(
          "⚡ Socket.IO funcionando"
        );

      }
    );


  } catch (error) {

    console.log(
      "💥 Error iniciando server:",
      error
    );

  }

};


startServer();

