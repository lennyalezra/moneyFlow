
import { Router } from "express";
import pool from "../config/db.js";
import verifierToken from "../middlewares/auth.js";

const router = Router();

router.use(verifierToken);

// Afficher les transactions de l'utilisateur
router.get("/", async (req, res) => {
  try {
    const resultat = await pool.query(
      `SELECT id, nom, montant, date, categorie_id
       FROM transactions
       WHERE user_id = $1
       ORDER BY date DESC, id DESC`,
      [req.userId]
    );

    res.json(resultat.rows);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter une transaction
router.post("/", async (req, res) => {
  try {
    const { nom, montant, date, categorie_id } = req.body;

    if (
      typeof nom !== "string" ||
      !nom.trim() ||
      nom.trim().length > 150 ||
      typeof montant !== "number" ||
      !Number.isFinite(montant) ||
      montant === 0 ||
      Math.abs(montant) > 9999999999.99 ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        message: "Informations de transaction invalides"
      });
    }

    const categorieId = categorie_id ?? null;

    if (categorieId !== null) {
      if (!Number.isInteger(categorieId) || categorieId <= 0) {
        return res.status(400).json({
          message: "Catégorie invalide"
        });
      }

      const categorie = await pool.query(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        [categorieId, req.userId]
      );

      if (categorie.rowCount === 0) {
        return res.status(400).json({
          message: "Catégorie introuvable"
        });
      }
    }

    const resultat = await pool.query(
      `INSERT INTO transactions
       (user_id, nom, montant, date, categorie_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, nom.trim(), montant, date, categorieId]
    );

    res.status(201).json(resultat.rows[0]);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier une transaction
router.put("/:id", async (req, res) => {
  try {
    const { nom, montant } = req.body;

    if (
      typeof nom !== "string" ||
      !nom.trim() ||
      nom.trim().length > 150 ||
      typeof montant !== "number" ||
      !Number.isFinite(montant) ||
      montant === 0 ||
      Math.abs(montant) > 9999999999.99
    ) {
      return res.status(400).json({
        message: "Informations invalides"
      });
    }

    const resultat = await pool.query(
      `UPDATE transactions
       SET nom = $1, montant = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [nom.trim(), montant, req.params.id, req.userId]
    );

    if (resultat.rowCount === 0) {
      return res.status(404).json({
        message: "Transaction introuvable"
      });
    }

    res.json(resultat.rows[0]);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une transaction
router.delete("/:id", async (req, res) => {
  try {
    const resultat = await pool.query(
      `DELETE FROM transactions
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.userId]
    );

    if (resultat.rowCount === 0) {
      return res.status(404).json({
        message: "Transaction introuvable"
      });
    }

    res.json({ message: "Transaction supprimée" });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
