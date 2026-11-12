
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import "./Statistiques.css";

const couleurs = [
  "#455d50",
  "#8ba58e",
  "#c8b8a4",
  "#a98ad0",
  "#79b3c6",
  "#dd8b86",
];

const formaterMontant = (montant) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);

function Statistiques({ transactions = [] }) {
  const [periode, setPeriode] = useState("mois");

  const donnees = useMemo(() => {
    const maintenant = new Date();

    const transactionsFiltrees = transactions.filter((transaction) => {
      const date = new Date(`${transaction.date}T12:00:00`);

      if (Number.isNaN(date.getTime())) return false;

      if (periode === "mois") {
        return (
          date.getMonth() === maintenant.getMonth() &&
          date.getFullYear() === maintenant.getFullYear()
        );
      }

      if (periode === "annee") {
        return date.getFullYear() === maintenant.getFullYear();
      }

      return true;
    });

    let revenus = 0;
    let depenses = 0;

    const categories = {};
    const evolution = {};

    transactionsFiltrees.forEach((transaction) => {
      const montant = Number(transaction.montant);

      if (!Number.isFinite(montant)) return;

      const date = new Date(`${transaction.date}T12:00:00`);

      const cle = date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        ...(periode === "mois" ? { day: "2-digit" } : {}),
      });

      const cleTri =
        periode === "mois"
          ? transaction.date
          : transaction.date.slice(0, 7);

      if (!evolution[cleTri]) {
        evolution[cleTri] = {
          date: cle,
          cleTri,
          revenus: 0,
          depenses: 0,
        };
      }

      if (montant > 0) {
        revenus += montant;
        evolution[cleTri].revenus += montant;
      } else if (montant < 0) {
        const valeur = Math.abs(montant);

        depenses += valeur;
        evolution[cleTri].depenses += valeur;

        const categorie = transaction.categorie || "Autre";

        categories[categorie] =
          (categories[categorie] || 0) + valeur;
      }
    });

    const evolutionGraphique = Object.values(evolution).sort(
      (a, b) => a.cleTri.localeCompare(b.cleTri)
    );

    const repartition = Object.entries(categories)
      .map(([nom, montant]) => ({
        nom,
        montant,
        pourcentage: depenses > 0 ? (montant / depenses) * 100 : 0,
      }))
      .sort((a, b) => b.montant - a.montant);

    return {
      revenus,
      depenses,
      epargne: revenus - depenses,
      evolutionGraphique,
      repartition,
      nombreTransactions: transactionsFiltrees.length,
    };
  }, [transactions, periode]);

  return (
    <div className="statistiques-page">
      <header className="statistiques-header">
        <div>
          <h1>Statistiques</h1>
          <p>Analyse tes finances et suis leur évolution.</p>
        </div>

        <select
          value={periode}
          onChange={(event) => setPeriode(event.target.value)}
          aria-label="Choisir une période"
        >
          <option value="mois">Ce mois-ci</option>
          <option value="annee">Cette année</option>
          <option value="tout">Toutes les périodes</option>
        </select>
      </header>

      <section className="statistiques-cartes">
        <article className="statistiques-carte">
          <div className="statistiques-carte-haut">
            <span className="statistiques-icone revenus">↗</span>
            <span>Revenus</span>
          </div>

          <strong className="statistiques-valeur revenus">
            {formaterMontant(donnees.revenus)}
          </strong>

          <p>Montant total reçu</p>
        </article>

        <article className="statistiques-carte">
          <div className="statistiques-carte-haut">
            <span className="statistiques-icone depenses">↘</span>
            <span>Dépenses</span>
          </div>

          <strong className="statistiques-valeur depenses">
            {formaterMontant(donnees.depenses)}
          </strong>

          <p>Montant total dépensé</p>
        </article>

        <article className="statistiques-carte">
          <div className="statistiques-carte-haut">
            <span className="statistiques-icone epargne">◇</span>
            <span>Épargne nette</span>
          </div>

          <strong
            className={`statistiques-valeur ${
              donnees.epargne < 0 ? "depenses" : "revenus"
            }`}
          >
            {formaterMontant(donnees.epargne)}
          </strong>

          <p>Revenus moins dépenses</p>
        </article>
      </section>

      <section className="statistiques-graphiques">
        <article className="statistiques-bloc statistiques-evolution">
          <div className="statistiques-bloc-entete">
            <div>
              <h2>Revenus et dépenses</h2>
              <p>Comparaison sur la période sélectionnée</p>
            </div>
          </div>

          <div className="statistiques-legende">
            <span>
              <i className="legende-revenus" /> Revenus
            </span>
            <span>
              <i className="legende-depenses" /> Dépenses
            </span>
          </div>

          {donnees.evolutionGraphique.length === 0 ? (
            <div className="statistiques-vide">
              Aucune transaction sur cette période.
            </div>
          ) : (
            <div className="statistiques-graphique">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={donnees.evolutionGraphique}
                  barGap={5}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0eb"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#849488", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#849488", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(valeur) =>
                      formaterMontant(Number(valeur))
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5eae3",
                    }}
                  />
                  <Bar
                    dataKey="revenus"
                    name="Revenus"
                    fill="#789985"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="depenses"
                    name="Dépenses"
                    fill="#d6a99a"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="statistiques-bloc statistiques-repartition">
          <div className="statistiques-bloc-entete">
            <div>
              <h2>Dépenses par catégorie</h2>
              <p>Répartition de tes dépenses</p>
            </div>
          </div>

          {donnees.repartition.length === 0 ? (
            <div className="statistiques-vide">
              Aucune dépense sur cette période.
            </div>
          ) : (
            <div className="statistiques-categories-liste">
              {donnees.repartition.map((categorie, index) => (
                <div
                  className="statistiques-categorie"
                  key={categorie.nom}
                >
                  <div className="statistiques-categorie-entete">
                    <span>
                      <i
                        style={{
                          backgroundColor:
                            couleurs[index % couleurs.length],
                        }}
                      />
                      {categorie.nom}
                    </span>
                    <strong>
                      {formaterMontant(categorie.montant)}
                    </strong>
                  </div>

                  <div className="statistiques-barre">
                    <div
                      style={{
                        width: `${categorie.pourcentage}%`,
                        backgroundColor:
                          couleurs[index % couleurs.length],
                      }}
                    />
                  </div>

                  <small>
                    {Math.round(categorie.pourcentage)} % des dépenses
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <footer className="statistiques-footer">
        <span>
          {donnees.nombreTransactions} transaction(s) sur la période
        </span>
        <span>
          Données actualisées automatiquement
        </span>
      </footer>
    </div>
  );
}

export default Statistiques;
