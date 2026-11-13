
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./Statistiques.css";

const formaterEuros = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(valeur) || 0);

const nomsMois = [
  "Janv.", "Févr.", "Mars", "Avr.",
  "Mai", "Juin", "Juil.", "Août",
  "Sept.", "Oct.", "Nov.", "Déc.",
];

function obtenirObjectifs() {
  try {
    const donnees = JSON.parse(
      localStorage.getItem("moneyflow-objectifs") || "[]"
    );
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function Statistiques({ transactions = [], objectifs }) {
  const [periode, setPeriode] = useState(6);

  const objectifsEnregistres = Array.isArray(objectifs)
    ? objectifs
    : obtenirObjectifs();

  const donnees = useMemo(() => {
    const maintenant = new Date();
    const mois = [];

    for (let i = periode - 1; i >= 0; i--) {
      const date = new Date(
        maintenant.getFullYear(),
        maintenant.getMonth() - i,
        1
      );

      const cle = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const transactionsMois = transactions.filter(
        (transaction) =>
          typeof transaction.date === "string" &&
          transaction.date.slice(0, 7) === cle
      );

      const revenus = transactionsMois
        .filter((transaction) => Number(transaction.montant) > 0)
        .reduce(
          (total, transaction) =>
            total + Number(transaction.montant),
          0
        );

      const depenses = transactionsMois
        .filter((transaction) => Number(transaction.montant) < 0)
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.montant)),
          0
        );

      mois.push({
        cle,
        nom: nomsMois[date.getMonth()],
        revenus,
        depenses,
        epargne: revenus - depenses,
      });
    }

    const totalRevenus = mois.reduce(
      (total, item) => total + item.revenus,
      0
    );

    const totalDepenses = mois.reduce(
      (total, item) => total + item.depenses,
      0
    );

    const soldePeriode = totalRevenus - totalDepenses;

    const moisActuel = mois[mois.length - 1];
    const moisPrecedent = mois[mois.length - 2];

    let variationDepenses = null;

    if (moisPrecedent && moisPrecedent.depenses > 0) {
      variationDepenses =
        ((moisActuel.depenses - moisPrecedent.depenses) /
          moisPrecedent.depenses) *
        100;
    }

    const objectifTotal = objectifsEnregistres.reduce(
      (total, objectif) =>
        total + Math.max(0, Number(objectif.cible) || 0),
      0
    );

    const epargneObjectifs = objectifsEnregistres.reduce(
      (total, objectif) =>
        total + Math.max(0, Number(objectif.economise) || 0),
      0
    );

    const progressionObjectifs =
      objectifTotal > 0
        ? Math.min(
            100,
            (epargneObjectifs / objectifTotal) * 100
          )
        : 0;

    const transactionsActuelles = transactions.filter(
      (transaction) =>
        typeof transaction.date === "string" &&
        transaction.date.slice(0, 7) === moisActuel.cle &&
        Number(transaction.montant) < 0
    );

    const depensesCategories = {};

    transactionsActuelles.forEach((transaction) => {
      const nom = transaction.categorie || "Autre";
      depensesCategories[nom] =
        (depensesCategories[nom] || 0) +
        Math.abs(Number(transaction.montant) || 0);
    });

    const categoriePrincipale = Object.entries(
      depensesCategories
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      mois,
      totalRevenus,
      totalDepenses,
      soldePeriode,
      moisActuel,
      moisPrecedent,
      variationDepenses,
      objectifTotal,
      epargneObjectifs,
      progressionObjectifs,
      categoriePrincipale,
    };
  }, [transactions, objectifsEnregistres.length, periode,
      JSON.stringify(objectifsEnregistres)]);

  const analyse = useMemo(() => {
    if (
      donnees.totalRevenus === 0 &&
      donnees.totalDepenses === 0
    ) {
      return {
        titre: "Commence ton analyse",
        texte:
          "Ajoute des transactions pour découvrir les tendances de tes finances.",
        statut: "neutre",
      };
    }

    if (
      !donnees.moisPrecedent ||
      (donnees.moisPrecedent.depenses === 0 &&
        donnees.moisPrecedent.revenus === 0)
    ) {
      return {
        titre: "Ton observation du moment",
        texte: `Tu as dépensé ${formaterEuros(
          donnees.moisActuel.depenses
        )} ce mois-ci. ${
          donnees.categoriePrincipale
            ? `Ta principale catégorie de dépenses est ${donnees.categoriePrincipale[0]}.`
            : "Aucune dépense enregistrée pour ce mois."
        } Il manque des données sur le mois précédent pour calculer une évolution fiable.`,
        statut: "neutre",
      };
    }

    if (donnees.variationDepenses === null) {
      return {
        titre: "Ton observation du moment",
        texte:
          "Aucune dépense n'était enregistrée le mois précédent. Une variation en pourcentage n'est donc pas calculable.",
        statut: "neutre",
      };
    }

    const variation = Math.abs(
      donnees.variationDepenses
    ).toFixed(1);

    if (donnees.variationDepenses > 0) {
      return {
        titre: "Tes dépenses ont augmenté",
        texte: `Tes dépenses ont augmenté de ${variation} % par rapport au mois précédent. ${
          donnees.categoriePrincipale
            ? `Ce mois-ci, ${donnees.categoriePrincipale[0]} est ta principale catégorie de dépenses.`
            : ""
        }`,
        statut: "attention",
      };
    }

    if (donnees.variationDepenses < 0) {
      return {
        titre: "Tes dépenses ont diminué",
        texte: `Bonne tendance : tes dépenses ont baissé de ${variation} % par rapport au mois précédent.`,
        statut: "positif",
      };
    }

    return {
      titre: "Des dépenses stables",
      texte:
        "Tes dépenses sont identiques à celles du mois précédent.",
      statut: "neutre",
    };
  }, [donnees]);

  const epargnePositive = Math.max(0, donnees.soldePeriode);

  return (
    <div className="stats-page">
      <header className="stats-header">
        <div>
          <span className="stats-sur-titre">
            MES STATISTIQUES
          </span>

          <h1>
            Analyse de mes finances
            <span className="stats-titre-icone"> ▥</span>
          </h1>

          <p>
            Visualise l'évolution de tes revenus, de tes
            dépenses et de ton épargne.
          </p>
        </div>

        <div
          className="stats-periodes"
          aria-label="Choisir une période"
        >
          {[3, 6, 12].map((nombre) => (
            <button
              key={nombre}
              type="button"
              className={
                periode === nombre ? "actif" : ""
              }
              onClick={() => setPeriode(nombre)}
              aria-pressed={periode === nombre}
            >
              {nombre === 12 ? "1 an" : `${nombre} mois`}
            </button>
          ))}
        </div>
      </header>

      <section className="stats-contenu">
        <article className="stats-graphique-carte">
          <div className="stats-carte-entete">
            <span className="stats-icone">⌁</span>
            <div>
              <h2>Revenus vs Dépenses</h2>
              <p>
                Comparaison sur les {periode} derniers mois.
              </p>
            </div>
          </div>

          <div className="stats-graphique">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={donnees.mois}
                margin={{
                  top: 12,
                  right: 16,
                  left: 0,
                  bottom: 2,
                }}
              >
                <CartesianGrid
                  stroke="#e9eee7"
                  vertical={false}
                />

                <XAxis
                  dataKey="nom"
                  tick={{
                    fill: "#7a8c7f",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#7a8c7f",
                    fontSize: 10,
                  }}
                  tickFormatter={(valeur) =>
                    `${valeur} €`
                  }
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />

                <Tooltip
                  formatter={(valeur, nom) => [
                    formaterEuros(valeur),
                    nom,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e3e9df",
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={30}
                />

                <Line
                  type="monotone"
                  dataKey="revenus"
                  name="Revenus"
                  stroke="#4d805a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="depenses"
                  name="Dépenses"
                  stroke="#a681c7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <div className="stats-colonne">
          <article className="stats-epargne-carte">
            <div className="stats-carte-entete">
              <span className="stats-icone">↗</span>
              <div>
                <h2>Bilan de la période</h2>
                <p>Revenus moins dépenses</p>
              </div>
            </div>

            <strong
              className={
                donnees.soldePeriode < 0
                  ? "stats-montant negatif"
                  : "stats-montant"
              }
            >
              {formaterEuros(donnees.soldePeriode)}
            </strong>

            <span className="stats-indication">
              {donnees.soldePeriode > 0
                ? `${formaterEuros(epargnePositive)} de solde positif`
                : donnees.soldePeriode < 0
                  ? "Dépenses supérieures aux revenus"
                  : "Revenus et dépenses équilibrés"}
            </span>
          </article>

          <article className="stats-objectif-carte">
            <div className="stats-carte-entete">
              <span className="stats-icone lavande">◎</span>
              <div>
                <h2>Mes objectifs d'épargne</h2>
                <p>Progression globale de tes objectifs</p>
              </div>
            </div>

            {donnees.objectifTotal > 0 ? (
              <>
                <strong className="stats-pourcentage">
                  {Math.round(
                    donnees.progressionObjectifs
                  )} %
                </strong>

                <div className="stats-barre">
                  <div
                    className="stats-barre-remplissage"
                    style={{
                      width: `${donnees.progressionObjectifs}%`,
                    }}
                  />
                </div>

                <div className="stats-objectif-bas">
                  <strong>
                    {formaterEuros(
                      donnees.epargneObjectifs
                    )} épargnés
                  </strong>
                  <span>
                    {formaterEuros(
                      donnees.objectifTotal
                    )}
                  </span>
                </div>
              </>
            ) : (
              <p className="stats-objectif-vide">
                Aucun objectif enregistré pour le moment.
                Tu peux en créer dans la page Objectifs.
              </p>
            )}
          </article>
        </div>
      </section>

      <section
        className={`stats-analyse ${analyse.statut}`}
      >
        <div className="stats-analyse-icone">✧</div>

        <div className="stats-analyse-texte">
          <span>ANALYSE AUTOMATIQUE</span>
          <h2>{analyse.titre}</h2>
          <p>{analyse.texte}</p>
        </div>

        <div className="stats-analyse-decoration">
          ◇
        </div>
      </section>

      <footer className="stats-footer">
        <span>
          Données calculées à partir de tes transactions
          MoneyFlow.
        </span>
        <span>
          Le bilan de période n'est pas un solde bancaire.
        </span>
      </footer>
    </div>
  );
}

export default Statistiques;
