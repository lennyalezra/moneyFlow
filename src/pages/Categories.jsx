
import { useEffect, useMemo, useState } from "react";
import "./Categories.css";

function formaterMontant(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

function Categories({
  transactions = [],
  setTransactions,
  categories = [],
  setCategories,
}) {
  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [categorieModifiee, setCategorieModifiee] =
    useState(null);

  const [nom, setNom] = useState("");
  const [type, setType] = useState("depense");
  const [couleur, setCouleur] = useState("#8ba58e");
  const [budget, setBudget] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  const [message, setMessage] = useState("");

  // ========================================
  // FERMETURE DU FORMULAIRE
  // ========================================

  useEffect(() => {
    if (!formulaireOuvert) return;

    function fermerAvecEchap(event) {
      if (event.key === "Escape") {
        setFormulaireOuvert(false);
      }
    }

    window.addEventListener("keydown", fermerAvecEchap);

    return () => {
      window.removeEventListener(
        "keydown",
        fermerAvecEchap
      );
    };
  }, [formulaireOuvert]);

  // ========================================
  // TRANSACTIONS DU MOIS
  // ========================================

  const transactionsDuMois = useMemo(() => {
    const maintenant = new Date();

    return transactions.filter((transaction) => {
      if (
        typeof transaction.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
      ) {
        return false;
      }

      const date = new Date(
        `${transaction.date}T12:00:00`
      );

      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === maintenant.getFullYear() &&
        date.getMonth() === maintenant.getMonth()
      );
    });
  }, [transactions]);

  // ========================================
  // CALCUL DES CATÉGORIES
  // ========================================

  const categoriesAvecMontants = useMemo(() => {
    return categories.map((categorie) => {
      const transactionsCategorie =
        transactionsDuMois.filter((transaction) => {
          const memeNom =
            transaction.categorie
              ?.trim()
              .toLowerCase() ===
            categorie.nom.trim().toLowerCase();

          const montant = Number(transaction.montant);

          const memeType =
            categorie.type === "depense"
              ? montant < 0
              : montant > 0;

          return memeNom && memeType;
        });

      const total = transactionsCategorie.reduce(
        (somme, transaction) =>
          somme + Math.abs(Number(transaction.montant)),
        0
      );

      const budgetCategorie =
        Number(categorie.budget) || 0;

      const progression =
        categorie.type === "depense" &&
        budgetCategorie > 0
          ? (total / budgetCategorie) * 100
          : 0;

      return {
        ...categorie,
        budget: budgetCategorie,
        total,
        progression,
        nombreTransactions:
          transactionsCategorie.length,
      };
    });
  }, [categories, transactionsDuMois]);

  // ========================================
  // RÉSUMÉ MENSUEL
  // ========================================

  const depensesTotales = useMemo(() => {
    return transactionsDuMois
      .filter(
        (transaction) =>
          Number(transaction.montant) < 0
      )
      .reduce(
        (somme, transaction) =>
          somme +
          Math.abs(Number(transaction.montant)),
        0
      );
  }, [transactionsDuMois]);

  const budgetTotal = useMemo(() => {
    return categories
      .filter(
        (categorie) =>
          categorie.type === "depense"
      )
      .reduce(
        (somme, categorie) =>
          somme + (Number(categorie.budget) || 0),
        0
      );
  }, [categories]);

  const progressionGlobale =
    budgetTotal > 0
      ? (depensesTotales / budgetTotal) * 100
      : 0;

  // ========================================
  // RECHERCHE ET FILTRES
  // ========================================

  const categoriesFiltrees = useMemo(() => {
    return categoriesAvecMontants.filter(
      (categorie) => {
        const correspondRecherche =
          categorie.nom
            .toLowerCase()
            .includes(
              recherche.trim().toLowerCase()
            );

        const correspondFiltre =
          filtre === "toutes" ||
          categorie.type === filtre;

        return (
          correspondRecherche &&
          correspondFiltre
        );
      }
    );
  }, [categoriesAvecMontants, recherche, filtre]);

  // ========================================
  // OUVERTURE DU FORMULAIRE
  // ========================================

  function ouvrirAjout() {
    setCategorieModifiee(null);
    setNom("");
    setType("depense");
    setCouleur("#8ba58e");
    setBudget("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(categorie) {
    setCategorieModifiee(categorie);
    setNom(categorie.nom);
    setType(categorie.type);
    setCouleur(categorie.couleur || "#8ba58e");
    setBudget(String(categorie.budget || 0));
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setCategorieModifiee(null);
    setMessage("");
  }

  // ========================================
  // AJOUT ET MODIFICATION
  // ========================================

  function enregistrerCategorie(event) {
    event.preventDefault();

    const nomNettoye = nom.trim();
    const budgetNombre = Number(budget || 0);

    if (!nomNettoye) {
      setMessage(
        "Le nom de la catégorie est obligatoire."
      );
      return;
    }

    if (
      !Number.isFinite(budgetNombre) ||
      budgetNombre < 0
    ) {
      setMessage(
        "Le budget doit être un nombre positif ou nul."
      );
      return;
    }

    const existeDeja = categories.some(
      (categorie) =>
        categorie.nom.trim().toLowerCase() ===
          nomNettoye.toLowerCase() &&
        categorie.type === type &&
        categorie.id !== categorieModifiee?.id
    );

    if (existeDeja) {
      setMessage(
        "Une catégorie de ce type porte déjà ce nom."
      );
      return;
    }

    if (categorieModifiee) {
      const ancienNom = categorieModifiee.nom;
      const ancienType = categorieModifiee.type;

      const transactionsAssociees =
        transactions.filter((transaction) => {
          const memeNom =
            transaction.categorie
              ?.trim()
              .toLowerCase() ===
            ancienNom.trim().toLowerCase();

          const montant = Number(
            transaction.montant
          );

          const memeType =
            ancienType === "depense"
              ? montant < 0
              : montant > 0;

          return memeNom && memeType;
        });

      if (
        ancienType !== type &&
        transactionsAssociees.length > 0
      ) {
        setMessage(
          "Cette catégorie contient des transactions. Tu ne peux pas changer son type tant qu'elles lui sont associées."
        );
        return;
      }

      setCategories((anciennes) =>
        anciennes.map((categorie) =>
          categorie.id === categorieModifiee.id
            ? {
                ...categorie,
                nom: nomNettoye,
                type,
                couleur,
                budget:
                  type === "revenu"
                    ? 0
                    : Math.round(
                        budgetNombre * 100
                      ) / 100,
              }
            : categorie
        )
      );

      if (
        ancienNom !== nomNettoye &&
        transactionsAssociees.length > 0
      ) {
        const idsAssocies = new Set(
          transactionsAssociees.map(
            (transaction) => transaction.id
          )
        );

        setTransactions((anciennes) =>
          anciennes.map((transaction) =>
            idsAssocies.has(transaction.id)
              ? {
                  ...transaction,
                  categorie: nomNettoye,
                }
              : transaction
          )
        );
      }

      fermerFormulaire();
      setMessage(
        "Catégorie modifiée avec succès."
      );
    } else {
      const nouvelleCategorie = {
        id:
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        nom: nomNettoye,
        type,
        couleur,
        budget:
          type === "revenu"
            ? 0
            : Math.round(
                budgetNombre * 100
              ) / 100,
        personnalisee: true,
      };

      setCategories((anciennes) => [
        ...anciennes,
        nouvelleCategorie,
      ]);

      fermerFormulaire();
      setMessage(
        "Catégorie ajoutée avec succès."
      );
    }
  }

  // ========================================
  // SUPPRESSION
  // ========================================

  function supprimerCategorie(categorie) {
    const utilisee = transactions.some(
      (transaction) => {
        const memeNom =
          transaction.categorie
            ?.trim()
            .toLowerCase() ===
          categorie.nom.trim().toLowerCase();

        const montant = Number(
          transaction.montant
        );

        const memeType =
          categorie.type === "depense"
            ? montant < 0
            : montant > 0;

        return memeNom && memeType;
      }
    );

    if (utilisee) {
      setMessage(
        "Cette catégorie contient des transactions. Modifie leur catégorie avant de la supprimer."
      );
      return;
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la catégorie « ${categorie.nom} » ?`
    );

    if (!confirmation) return;

    setCategories((anciennes) =>
      anciennes.filter(
        (element) =>
          element.id !== categorie.id
      )
    );

    setMessage(
      "Catégorie supprimée avec succès."
    );
  }

  // ========================================
  // AFFICHAGE
  // ========================================

  return (
    <div className="categories-page">
      <header className="categories-header">
        <div>
          <h1>Catégories</h1>
          <p>
            Gère tes catégories, suis tes dépenses
            et définis tes budgets.
          </p>
        </div>

        <button
          className="categories-btn-principal"
          onClick={ouvrirAjout}
        >
          + Ajouter une catégorie
        </button>
      </header>

      {/* RÉSUMÉ */}

      <section className="categories-resume">
        <article className="categories-stat">
          <span className="categories-stat-icone">
            ◇
          </span>

          <div>
            <strong>
              {categories.length}
            </strong>
            <p>Catégories</p>
          </div>
        </article>

        <article className="categories-stat">
          <span className="categories-stat-icone">
            €
          </span>

          <div>
            <strong>
              {formaterMontant(
                depensesTotales
              )}
            </strong>
            <p>Dépenses du mois</p>
          </div>
        </article>

        <article className="categories-stat">
          <span className="categories-stat-icone">
            ◎
          </span>

          <div>
            <strong>
              {budgetTotal > 0
                ? `${Math.round(
                    progressionGlobale
                  )} %`
                : "—"}
            </strong>

            <p>Du budget mensuel utilisé</p>
          </div>
        </article>
      </section>

      {/* TABLEAU DES CATÉGORIES */}

      <section className="categories-carte">
        <div className="categories-table-header">
          <div>
            <h2>Mes catégories</h2>
            <p>
              Retrouve tes dépenses et tes budgets
              par catégorie.
            </p>
          </div>

          <div className="categories-filtres">
            <input
              type="search"
              placeholder="Rechercher..."
              aria-label="Rechercher une catégorie"
              value={recherche}
              onChange={(event) =>
                setRecherche(event.target.value)
              }
            />

            <select
              value={filtre}
              onChange={(event) =>
                setFiltre(event.target.value)
              }
              aria-label="Filtrer les catégories"
            >
              <option value="toutes">
                Toutes
              </option>
              <option value="depense">
                Dépenses
              </option>
              <option value="revenu">
                Revenus
              </option>
            </select>
          </div>
        </div>

        <div className="categories-table-scroll">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Type</th>
                <th>Montant du mois</th>
                <th>Budget</th>
                <th>Progression</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categoriesFiltrees.map(
                (categorie) => (
                  <tr key={categorie.id}>
                    <td>
                      <div className="categories-nom">
                        <span
                          className="categories-pastille"
                          style={{
                            backgroundColor:
                              categorie.couleur,
                          }}
                        >
                          {categorie.nom
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {categorie.nom}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          categorie.type === "revenu"
                            ? "categories-type revenu"
                            : "categories-type depense"
                        }
                      >
                        {categorie.type === "revenu"
                          ? "Revenu"
                          : "Dépense"}
                      </span>
                    </td>

                    <td>
                      <strong
                        className={
                          categorie.type === "revenu"
                            ? "categories-montant-revenu"
                            : ""
                        }
                      >
                        {categorie.type === "revenu"
                          ? "+"
                          : ""}
                        {formaterMontant(
                          categorie.total
                        )}
                      </strong>
                    </td>

                    <td>
                      {categorie.type === "revenu"
                        ? "—"
                        : formaterMontant(
                            categorie.budget
                          )}
                    </td>

                    <td>
                      {categorie.type === "revenu" ||
                      categorie.budget === 0 ? (
                        <span className="categories-sans-budget">
                          —
                        </span>
                      ) : (
                        <div className="categories-progression">
                          <div className="categories-barre">
                            <div
                              className={
                                categorie.progression > 100
                                  ? "categories-barre-remplissage depasse"
                                  : "categories-barre-remplissage"
                              }
                              style={{
                                width: `${Math.min(
                                  categorie.progression,
                                  100
                                )}%`,
                                backgroundColor:
                                  categorie.progression > 100
                                    ? "#d77b74"
                                    : categorie.couleur,
                              }}
                            />
                          </div>

                          <span>
                            {Math.round(
                              categorie.progression
                            )}{" "}
                            %
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="categories-actions">
                        <button
                          className="categories-action-modifier"
                          onClick={() =>
                            ouvrirModification(
                              categorie
                            )
                          }
                          title={`Modifier ${categorie.nom}`}
                          aria-label={`Modifier ${categorie.nom}`}
                        >
                          ✎
                        </button>

                        <button
                          className="categories-action-supprimer"
                          onClick={() =>
                            supprimerCategorie(
                              categorie
                            )
                          }
                          title={`Supprimer ${categorie.nom}`}
                          aria-label={`Supprimer ${categorie.nom}`}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {categoriesFiltrees.length === 0 && (
            <p className="categories-vide">
              Aucune catégorie trouvée.
            </p>
          )}
        </div>

        <div className="categories-table-footer">
          {categoriesFiltrees.length} catégorie(s)
          affichée(s)
        </div>
      </section>

      {/* MESSAGE DE CONFIRMATION */}

      {message && (
        <div
          className="categories-message"
          role="status"
        >
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      {/* FORMULAIRE AJOUT / MODIFICATION */}

      {formulaireOuvert && (
        <div
          className="categories-modal-fond"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fermerFormulaire();
            }
          }}
        >
          <div
            className="categories-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="categories-modal-titre"
          >
            <div className="categories-modal-header">
              <div>
                <h2 id="categories-modal-titre">
                  {categorieModifiee
                    ? "Modifier une catégorie"
                    : "Ajouter une catégorie"}
                </h2>

                <p>
                  Personnalise ta catégorie.
                </p>
              </div>

              <button
                className="categories-modal-fermer"
                onClick={fermerFormulaire}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <form
              className="categories-formulaire"
              onSubmit={enregistrerCategorie}
            >
              <label htmlFor="categorie-nom">
                Nom
              </label>

              <input
                id="categorie-nom"
                type="text"
                placeholder="Ex : Shopping"
                value={nom}
                maxLength={35}
                onChange={(event) =>
                  setNom(event.target.value)
                }
                required
                autoFocus
              />

              <label htmlFor="categorie-type">
                Type
              </label>

              <select
                id="categorie-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
              >
                <option value="depense">
                  Dépense
                </option>

                <option value="revenu">
                  Revenu
                </option>
              </select>

              {type === "depense" && (
                <>
                  <label htmlFor="categorie-budget">
                    Budget mensuel prévu (€)
                  </label>

                  <input
                    id="categorie-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex : 250"
                    value={budget}
                    onChange={(event) =>
                      setBudget(
                        event.target.value
                      )
                    }
                  />
                </>
              )}

              <label htmlFor="categorie-couleur">
                Couleur
              </label>

              <div className="categories-choix-couleur">
                <input
                  id="categorie-couleur"
                  type="color"
                  value={couleur}
                  onChange={(event) =>
                    setCouleur(
                      event.target.value
                    )
                  }
                />

                <span>{couleur}</span>
              </div>

              <div className="categories-modal-actions">
                <button
                  type="button"
                  className="categories-btn-annuler"
                  onClick={fermerFormulaire}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="categories-btn-principal"
                >
                  {categorieModifiee
                    ? "Enregistrer"
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
