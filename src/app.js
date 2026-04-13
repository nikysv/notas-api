import "dotenv/config";
import express from "express";
import cors from "cors";
import "express-async-errors";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//imagenes estaticas
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Notas API running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//middleware de manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
export default app;
