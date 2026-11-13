
import { useMemo, useState } from "react";
import "./Budgets.css";

const formaterMontant = (montant) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);

function Budgets({
  transactions = [],
  categories = [],
  setCategories,
}) {
  const [recherche, setRecherche] = useState("");
  const [categorieSelectionnee, setCategorieSelectionnee] =
    useState(null);
  const [nouveauBudget, setNouveauBudget] = useState("");
  const [erreur, setErreur] = useState("");

  const donnees = useMemo(() => {
    const maintenant = new Date();

    const transactionsDuMois = transactions.filter(
      (transaction) => {
        const date = new Date(
          `${transaction.date}T12:00:00`
        );

        return (
          !Number.isNaN(date.getTime()) &&
          date.getMonth() === maintenant.getMonth() &&
          date.getFullYear() === maintenant.getFullYear()
        );
      }
    );

    const categoriesDepenses = categories.filter(
      (categorie) => categorie.type === "depense"
    );

    const budgets = categoriesDepenses.map((categorie) => {
      const depenses = transactionsDuMois
        .filter(
          (transaction) =>
            transaction.categorie?.trim().toLowerCase() ===
              categorie.nom.trim().toLowerCase() &&
            Number(transaction.montant) < 0
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.montant)),
          0
        );

      const budget = Number(categorie.budget) || 0;
      const restant = budget - depenses;

      return {
        ...categorie,
        budget,
        depenses,
        restant,
        progression:
          budget > 0 ? (depenses / budget) * 100 : 0,
        depasse: depenses > budget,
      };
    });

    const budgetTotal = budgets.reduce(
      (total, categorie) => total + categorie.budget,
      0
    );

    const depensesTotales = transactionsDuMois
      .filter(
        (transaction) => Number(transaction.montant) < 0
      )
      .reduce(
        (total, transaction) =>
          total + Math.abs(Number(transaction.montant)),
        0
      );

    return {
      budgets,
      budgetTotal,
      depensesTotales,
      disponible: budgetTotal - depensesTotales,
      depassements: budgets.filter(
        (categorie) => categorie.depasse
      ).length,
    };
  }, [transactions, categories]);

  const budgetsFiltres = donnees.budgets.filter(
    (categorie) =>
      categorie.nom
        .toLowerCase()
        .includes(recherche.trim().toLowerCase())
  );

  function ouvrirModification(categorie) {
    setCategorieSelectionnee(categorie);
    setNouveauBudget(String(categorie.budget));
    setErreur("");
  }

  function fermerModification() {
    setCategorieSelectionnee(null);
    setNouveauBudget("");
    setErreur("");
  }

  function enregistrerBudget(event) {
    event.preventDefault();

    if (!categorieSelectionnee) {
      return;
    }

    const valeur = Number(nouveauBudget);

    if (
      nouveauBudget.trim() === "" ||
      !Number.isFinite(valeur) ||
      valeur < 0
    ) {
      setErreur(
        "Saisis un budget valide, supérieur ou égal à 0."
      );
      return;
    }

    const budgetArrondi =
      Math.round(valeur * 100) / 100;

    setCategories((anciennes) =>
      anciennes.map((categorie) =>
        categorie.id === categorieSelectionnee.id
          ? {
              ...categorie,
              budget: budgetArrondi,
            }
          : categorie
      )
    );

    fermerModification();
  }

  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <div>
          <h1>Mes budgets</h1>
          <p>
            Gère tes limites de dépenses et suis tes budgets
            mensuels.
          </p>
        </div>
      </header>

      <section className="budgets-resume">
        <article className="budgets-stat">
          <div className="budgets-stat-icone">◇</div>

          <div>
            <strong>
              {formaterMontant(donnees.budgetTotal)}
            </strong>
            <p>Budget mensuel total</p>
          </div>
        </article>

        <article className="budgets-stat">
          <div className="budgets-stat-icone depense">
            €
          </div>

          <div>
            <strong>
              {formaterMontant(donnees.depensesTotales)}
            </strong>
            <p>Dépenses du mois</p>
          </div>
        </article>

        <article className="budgets-stat">
          <div className="budgets-stat-icone disponible">
            ◎
          </div>

          <div>
            <strong
              className={
                donnees.disponible < 0
                  ? "budgets-texte-danger"
                  : ""
              }
            >
              {formaterMontant(donnees.disponible)}
            </strong>

            <p>Budget disponible</p>
          </div>
        </article>
      </section>

      <section className="budgets-carte">
        <div className="budgets-carte-entete">
          <div>
            <h2>Budgets par catégorie</h2>
            <p>
              Retrouve les dépenses du mois et les limites
              de chaque catégorie.
            </p>
          </div>

          <input
            type="search"
            placeholder="Rechercher..."
            value={recherche}
            onChange={(event) =>
              setRecherche(event.target.value)
            }
            aria-label="Rechercher un budget"
          />
        </div>

        {donnees.depassements > 0 && (
          <div className="budgets-alerte">
            <span>!</span>
            {donnees.depassements} catégorie(s) ont dépassé
            leur budget.
          </div>
        )}

        <div className="budgets-liste">
          {budgetsFiltres.length === 0 ? (
            <p className="budgets-vide">
              Aucun budget trouvé.
            </p>
          ) : (
            budgetsFiltres.map((categorie) => (
              <article
                className="budgets-ligne"
                key={categorie.id}
              >
                <div className="budgets-ligne-haut">
                  <div className="budgets-identite">
                    <span
                      className="budgets-pastille"
                      style={{
                        backgroundColor:
                          categorie.couleur || "#8ba58e",
                      }}
                    >
                      {categorie.nom
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div>
                      <h3>{categorie.nom}</h3>

                      <p>
                        {formaterMontant(
                          categorie.depenses
                        )}{" "}
                        dépensés
                      </p>
                    </div>
                  </div>

                  <div className="budgets-montants">
                    <strong>
                      {formaterMontant(
                        categorie.depenses
                      )}

                      <span>
                        {" / "}
                        {formaterMontant(
                          categorie.budget
                        )}
                      </span>
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        ouvrirModification(categorie)
                      }
                    >
                      Modifier
                    </button>
                  </div>
                </div>

                <div className="budgets-progression">
                  <div className="budgets-barre">
                    <div
                      className={
                        categorie.depasse
                          ? "budgets-barre-remplissage depasse"
                          : "budgets-barre-remplissage"
                      }
                      style={{
                        width: `${
                          categorie.budget > 0
                            ? Math.min(
                                categorie.progression,
                                100
                              )
                            : categorie.depenses > 0
                              ? 100
                              : 0
                        }%`,
                        backgroundColor:
                          categorie.depasse
                            ? "#d77b74"
                            : categorie.couleur ||
                              "#8ba58e",
                      }}
                    />
                  </div>

                  <span
                    className={
                      categorie.depasse
                        ? "budgets-texte-danger"
                        : ""
                    }
                  >
                    {categorie.budget > 0
                      ? `${Math.round(
                          categorie.progression
                        )} %`
                      : "Sans budget défini"}
                  </span>
                </div>

                <div className="budgets-ligne-bas">
                  <span>
                    {categorie.depasse
                      ? `Dépassement de ${formaterMontant(
                          Math.abs(categorie.restant)
                        )}`
                      : `Disponible : ${formaterMontant(
                          categorie.restant
                        )}`}
                  </span>

                  {categorie.depasse && (
                    <span className="budgets-badge-danger">
                      Budget dépassé
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="budgets-footer">
          <span>
            {budgetsFiltres.length} budget(s)
            affiché(s)
          </span>

          <span>
            Modifications synchronisées avec
            Catégories et Accueil
          </span>
        </footer>
      </section>

      {categorieSelectionnee && (
        <div
          className="budgets-modal-fond"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              fermerModification();
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
              Modifier le budget
            </h2>

            <p>
              Catégorie :{" "}
              <strong>
                {categorieSelectionnee.nom}
              </strong>
            </p>

            <form onSubmit={enregistrerBudget}>
              <label htmlFor="nouveau-budget">
                Budget mensuel prévu (€)
              </label>

              <input
                id="nouveau-budget"
                type="number"
                min="0"
                step="0.01"
                value={nouveauBudget}
                onChange={(event) =>
                  setNouveauBudget(
                    event.target.value
                  )
                }
                required
                autoFocus
              />

              {erreur && (
                <p className="budgets-erreur">
                  {erreur}
                </p>
              )}

              <div className="budgets-modal-actions">
                <button
                  type="button"
                  className="budgets-btn-annuler"
                  onClick={fermerModification}
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
