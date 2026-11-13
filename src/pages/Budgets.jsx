
import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./Budgets.css";

const formaterMontant = (montant) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(montant) || 0);

const moisEnFrancais = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function obtenirCleMois(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function lireBudgetsGlobaux() {
  try {
    const donnees = JSON.parse(
      localStorage.getItem("moneyflow-budgets-globaux")
    );

    return donnees && typeof donnees === "object"
      ? donnees
      : {};
  } catch {
    return {};
  }
}

function Budgets({
  transactions = [],
  categories = [],
  setCategories,
}) {
  const [moisSelectionne, setMoisSelectionne] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [budgetsGlobaux, setBudgetsGlobaux] =
    useState(lireBudgetsGlobaux);

  const [modal, setModal] = useState(null);
  const [montantSaisi, setMontantSaisi] = useState("");
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  const cleMois = obtenirCleMois(moisSelectionne);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-budgets-globaux",
      JSON.stringify(budgetsGlobaux)
    );
  }, [budgetsGlobaux]);

  const donnees = useMemo(() => {
    const transactionsDuMois = transactions.filter(
      (transaction) =>
        typeof transaction.date === "string" &&
        transaction.date.slice(0, 7) === cleMois
    );

    const categoriesDepenses = categories.filter(
      (categorie) => categorie.type === "depense"
    );

    const budgets = categoriesDepenses.map((categorie) => {
      const depenses = transactionsDuMois
        .filter(
          (transaction) =>
            Number(transaction.montant) < 0 &&
            String(transaction.categorie || "")
              .trim()
              .toLowerCase() ===
              String(categorie.nom || "").trim().toLowerCase()
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.montant)),
          0
        );

      const budget = Number(categorie.budget) || 0;

      return {
        ...categorie,
        budget,
        depenses,
        restant: budget - depenses,
        progression:
          budget > 0 ? (depenses / budget) * 100 : 0,
        depasse: depenses > budget,
      };
    });

    const depensesTotales = transactionsDuMois
      .filter((transaction) => Number(transaction.montant) < 0)
      .reduce(
        (total, transaction) =>
          total + Math.abs(Number(transaction.montant)),
        0
      );

    const budgetReparti = budgets.reduce(
      (total, categorie) => total + categorie.budget,
      0
    );

    const budgetGlobal = Number(budgetsGlobaux[cleMois]) || 0;

    const categoriesDepassees = budgets.filter(
      (categorie) => categorie.depasse
    );

    const repartition = budgets
      .filter((categorie) => categorie.budget > 0)
      .map((categorie) => ({
        name: categorie.nom,
        value: categorie.budget,
        couleur: categorie.couleur || "#8ba58e",
      }));

    return {
      budgets,
      depensesTotales,
      budgetReparti,
      budgetGlobal,
      restant: budgetGlobal - depensesTotales,
      nonReparti: budgetGlobal - budgetReparti,
      progression:
        budgetGlobal > 0
          ? (depensesTotales / budgetGlobal) * 100
          : 0,
      categoriesDepassees,
      repartition,
    };
  }, [transactions, categories, cleMois, budgetsGlobaux]);

  const budgetsFiltres = donnees.budgets.filter((categorie) =>
    categorie.nom
      .toLowerCase()
      .includes(recherche.trim().toLowerCase())
  );

  function changerMois(decalage) {
    setMoisSelectionne(
      (ancien) =>
        new Date(
          ancien.getFullYear(),
          ancien.getMonth() + decalage,
          1
        )
    );
  }

  function ouvrirBudgetGlobal() {
    setMontantSaisi(
      budgetsGlobaux[cleMois] !== undefined
        ? String(budgetsGlobaux[cleMois])
        : ""
    );
    setErreur("");
    setModal({ type: "global" });
  }

  function ouvrirBudgetCategorie(categorie) {
    setMontantSaisi(String(categorie.budget));
    setErreur("");
    setModal({ type: "categorie", categorie });
  }

  function fermerModal() {
    setModal(null);
    setMontantSaisi("");
    setErreur("");
  }

  function enregistrerBudget(event) {
    event.preventDefault();

    const montant = Number(montantSaisi);

    if (
      montantSaisi.trim() === "" ||
      !Number.isFinite(montant) ||
      montant < 0
    ) {
      setErreur(
        "Saisis un montant valide supérieur ou égal à zéro."
      );
      return;
    }

    const montantArrondi = Math.round(montant * 100) / 100;

    if (modal.type === "global") {
      setBudgetsGlobaux((anciens) => ({
        ...anciens,
        [cleMois]: montantArrondi,
      }));
    } else if (modal.type === "categorie") {
      setCategories((anciennes) =>
        anciennes.map((categorie) =>
          categorie.id === modal.categorie.id
            ? { ...categorie, budget: montantArrondi }
            : categorie
        )
      );
    }

    fermerModal();
  }

  const progressionAffichee = Math.min(
    100,
    Math.max(0, donnees.progression)
  );

  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <div>
          <span className="budgets-sur-titre">MES BUDGETS</span>
          <h1>Gérer mes budgets <span>👛</span></h1>
          <p>
            Planifie tes dépenses, suis tes limites et garde
            le contrôle de ton argent.
          </p>
        </div>

        <div className="budgets-navigation-mois">
          <button
            type="button"
            onClick={() => changerMois(-1)}
            aria-label="Mois précédent"
          >
            ‹
          </button>

          <div className="budgets-mois-actuel">
            <span>▦</span>
            {moisEnFrancais.format(moisSelectionne)}
          </div>

          <button
            type="button"
            onClick={() => changerMois(1)}
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>
      </header>

      <section className="budgets-haut">
        <article className="budgets-global">
          <div className="budgets-global-icone">💵</div>

          <div className="budgets-global-contenu">
            <p>Budget mensuel</p>

            <div className="budgets-global-montant">
              <h2>
                {formaterMontant(donnees.budgetGlobal)}
              </h2>

              <button
                type="button"
                onClick={ouvrirBudgetGlobal}
                aria-label="Modifier le budget mensuel"
                title="Modifier le budget mensuel"
              >
                ✎
              </button>
            </div>

            <div className="budgets-global-chiffres">
              <span>
                {formaterMontant(donnees.depensesTotales)}
                {" / "}
                {formaterMontant(donnees.budgetGlobal)}
              </span>
            </div>

            <div className="budgets-barre globale">
              <div
                className={
                  donnees.progression > 100
                    ? "budgets-remplissage danger"
                    : "budgets-remplissage"
                }
                style={{ width: `${progressionAffichee}%` }}
              />
            </div>

            <div className="budgets-global-bas">
              <strong
                className={
                  donnees.restant < 0 ? "texte-danger" : ""
                }
              >
                {donnees.restant < 0
                  ? `${formaterMontant(
                      Math.abs(donnees.restant)
                    )} de dépassement`
                  : `${formaterMontant(
                      donnees.restant
                    )} restants`}
              </strong>

              <span>
                {Math.round(donnees.progression)} % utilisé
              </span>
            </div>
          </div>
        </article>

        <article className="budgets-alerte-carte">
          <div className="budgets-alerte-icone">♧</div>

          <div>
            <h3>
              {donnees.categoriesDepassees.length > 0
                ? "Attention"
                : "Tout est sous contrôle"}
            </h3>

            <p>
              {donnees.categoriesDepassees.length > 0
                ? `${donnees.categoriesDepassees.length} catégorie(s) ont dépassé leur budget.`
                : "Aucun dépassement par catégorie pour ce mois."}
            </p>

            {donnees.categoriesDepassees.length > 0 && (
              <span>
                {donnees.categoriesDepassees
                  .map((categorie) => categorie.nom)
                  .join(", ")}
              </span>
            )}
          </div>
        </article>
      </section>

      <section className="budgets-milieu">
        <article className="budgets-repartition">
          <h2>Répartition du budget</h2>

          <div className="budgets-repartition-contenu">
            <div className="budgets-graphique">
              {donnees.repartition.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donnees.repartition}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="63%"
                      outerRadius="88%"
                      paddingAngle={2}
                    >
                      {donnees.repartition.map((item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={item.couleur}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formaterMontant(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="budgets-graphique-vide">
                  Aucun budget réparti
                </div>
              )}

              {donnees.repartition.length > 0 && (
                <div className="budgets-graphique-centre">
                  <strong>
                    {formaterMontant(donnees.budgetReparti)}
                  </strong>
                  <span>Budget réparti</span>
                </div>
              )}
            </div>

            <div className="budgets-legende">
              {donnees.repartition.map((item, index) => (
                <div
                  className="budgets-legende-ligne"
                  key={`${item.name}-${index}`}
                >
                  <span
                    className="budgets-legende-point"
                    style={{ background: item.couleur }}
                  />

                  <span className="budgets-legende-nom">
                    {item.name}
                  </span>

                  <strong>
                    {donnees.budgetReparti > 0
                      ? Math.round(
                          (item.value /
                            donnees.budgetReparti) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="budgets-conseil">
          <div className="budgets-conseil-titre">
            <span>✦</span>
            <h2>Conseil du mois</h2>
          </div>

          {donnees.budgetGlobal <= 0 ? (
            <p>
              Commence par définir ton budget mensuel
              pour mieux organiser tes dépenses.
            </p>
          ) : donnees.nonReparti > 0 ? (
            <p>
              Il te reste{" "}
              <strong>
                {formaterMontant(donnees.nonReparti)}
              </strong>{" "}
              à répartir entre tes catégories.
            </p>
          ) : donnees.nonReparti < 0 ? (
            <p>
              Tes budgets par catégorie dépassent ton
              budget global de{" "}
              <strong>
                {formaterMontant(
                  Math.abs(donnees.nonReparti)
                )}
              </strong>.
            </p>
          ) : donnees.progression > 100 ? (
            <p>
              Ton budget mensuel est dépassé.
              Consulte tes dépenses pour identifier
              les postes à ajuster.
            </p>
          ) : (
            <p>
              Bravo, tu as réparti l'ensemble de ton
              budget mensuel entre tes catégories !
            </p>
          )}

          <div className="budgets-conseil-decoration">
            ✧
          </div>
        </article>
      </section>

      <section className="budgets-tableau-section">
        <div className="budgets-tableau-entete">
          <div>
            <h2>Budgets par catégorie</h2>
            <p>
              Consulte et ajuste les limites de tes catégories.
            </p>
          </div>

          <input
            type="search"
            placeholder="Rechercher une catégorie..."
            value={recherche}
            onChange={(event) =>
              setRecherche(event.target.value)
            }
          />
        </div>

        <div className="budgets-tableau-scroll">
          <table className="budgets-tableau">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Budget prévu</th>
                <th>Dépensé</th>
                <th>Restant</th>
                <th>Progression</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {budgetsFiltres.map((categorie) => {
                const progression = Math.min(
                  100,
                  Math.max(0, categorie.progression)
                );

                return (
                  <tr key={categorie.id}>
                    <td>
                      <div className="budgets-categorie-identite">
                        <span
                          className="budgets-categorie-icone"
                          style={{
                            background:
                              categorie.couleur || "#8ba58e",
                          }}
                        >
                          {categorie.nom.charAt(0).toUpperCase()}
                        </span>

                        <strong>{categorie.nom}</strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formaterMontant(categorie.budget)}
                      </strong>
                    </td>

                    <td
                      className={
                        categorie.depasse
                          ? "texte-danger"
                          : ""
                      }
                    >
                      {formaterMontant(categorie.depenses)}
                    </td>

                    <td>
                      <span
                        className={
                          categorie.restant < 0
                            ? "budgets-restant danger"
                            : "budgets-restant"
                        }
                      >
                        {formaterMontant(categorie.restant)}
                      </span>
                    </td>

                    <td>
                      <div className="budgets-progression-cellule">
                        <div className="budgets-barre">
                          <div
                            className={
                              categorie.depasse
                                ? "budgets-remplissage danger"
                                : "budgets-remplissage"
                            }
                            style={{
                              width: `${
                                categorie.budget > 0
                                  ? progression
                                  : categorie.depenses > 0
                                  ? 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <span>
                          {categorie.budget > 0
                            ? `${Math.round(
                                categorie.progression
                              )}%`
                            : "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="budgets-modifier"
                        onClick={() =>
                          ouvrirBudgetCategorie(categorie)
                        }
                        title={`Modifier ${categorie.nom}`}
                        aria-label={`Modifier le budget ${categorie.nom}`}
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {budgetsFiltres.length === 0 && (
            <p className="budgets-vide">
              Aucune catégorie trouvée.
            </p>
          )}
        </div>
      </section>

      {modal && (
        <div
          className="budgets-modal-fond"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerModal();
            }
          }}
        >
          <div
            className="budgets-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budgets-modal-titre"
          >
            <h2 id="budgets-modal-titre">
              {modal.type === "global"
                ? "Modifier le budget mensuel"
                : "Modifier le budget de la catégorie"}
            </h2>

            <p>
              {modal.type === "global"
                ? `Budget global pour ${moisEnFrancais.format(
                    moisSelectionne
                  )}`
                : `Catégorie : ${modal.categorie.nom}`}
            </p>

            <form onSubmit={enregistrerBudget}>
              <label htmlFor="budgets-montant">
                Montant prévu (€)
              </label>

              <input
                id="budgets-montant"
                type="number"
                min="0"
                step="0.01"
                value={montantSaisi}
                onChange={(event) =>
                  setMontantSaisi(event.target.value)
                }
                autoFocus
                required
              />

              {erreur && (
                <p className="budgets-erreur">{erreur}</p>
              )}

              <div className="budgets-modal-actions">
                <button
                  type="button"
                  className="budgets-btn-annuler"
                  onClick={fermerModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="budgets-btn-enregistrer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
