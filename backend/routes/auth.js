
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    if (
      typeof nom !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !nom.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Nom, email et mot de passe de 8 caractères minimum requis."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resultat = await pool.query(
      `INSERT INTO users (nom, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, nom, email`,
      [nom.trim(), email.trim(), passwordHash]
    );

    res.status(201).json({
      message: "Compte créé avec succès",
      user: resultat.rows[0]
    });
  } catch (erreur) {
    if (erreur.code === "23505") {
      return res.status(409).json({
        message: "Cet email est déjà utilisé."
      });
    }

    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email et mot de passe requis."
      });
    }

    const resultat = await pool.query(
      "SELECT * FROM users WHERE email = LOWER($1)",
      [email.trim()]
    );

    const user = resultat.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Identifiants incorrects."
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email
      }
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
