
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import transactionsRoutes from "./routes/transactions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());

// Route principale de notre API
app.get("/api", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API MoneyFlow !",
    statut: "success"
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const resultat = await pool.query("SELECT NOW()");

    res.json({
      message: "Connexion PostgreSQL réussie !",
      date: resultat.rows[0].now
    });
  } catch (erreur) {
    console.error("Erreur PostgreSQL :", erreur);

    res.status(500).json({
      message: "Erreur de connexion à PostgreSQL"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.listen(PORT, () => {
  console.log(`Serveur MoneyFlow démarré sur http://localhost:${PORT}`);
});
