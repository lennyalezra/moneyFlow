
import { useEffect, useMemo, useState } from "react";
import "./Categories.css";

const categoriesInitiales = [
  { id: "alimentation", nom: "Alimentation", type: "depense", couleur: "#8ba58e", budget: 400 },
  { id: "logement", nom: "Logement", type: "depense", couleur: "#a98ad0", budget: 1000 },
  { id: "transport", nom: "Transport", type: "depense", couleur: "#79b3c6", budget: 200 },
  { id: "loisirs", nom: "Loisirs", type: "depense", couleur: "#e7bb6a", budget: 150 },
  { id: "sante", nom: "Santé", type: "depense", couleur: "#dd8b86", budget: 100 },
  { id: "shopping", nom: "Shopping", type: "depense", couleur: "#c8b8a4", budget: 200 },
  { id: "abonnements", nom: "Abonnements", type: "depense", couleur: "#739e8c", budget: 100 },
  { id: "autre-depense", nom: "Autre", type: "depense", couleur: "#9caaa0", budget: 100 },

  { id: "salaire", nom: "Salaire", type: "revenu", couleur: "#65a777", budget: 0 },
  { id: "prime", nom: "Prime", type: "revenu", couleur: "#81b59a", budget: 0 },
  { id: "cadeau", nom: "Cadeau", type: "revenu", couleur: "#a98ad0", budget: 0 },
  { id: "remboursement", nom: "Remboursement", type: "revenu", couleur: "#79b3c6", budget: 0 },
  { id: "autre-revenu", nom: "Autre", type: "revenu", couleur: "#e7bb6a", budget: 0 },
];

function formaterMontant(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

function Categories({
  transactions = [],
  setTransactions,
  categories,
  setCategories
}) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [categorieModifiee, setCategorieModifiee] = useState(null);

  const [nom, setNom] = useState("");
  const [type, setType] = useState("depense");
  const [couleur, setCouleur] = useState("#8ba58e");
  const [budget, setBudget] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-categories",
      JSON.stringify(categories)
    );
  }, [categories]);

  useEffect(() => {
    if (!formulaireOuvert) return;

    function fermerAvecEchap(event) {
      if (event.key === "Escape") {
        setFormulaireOuvert(false);
      }
    }

    window.addEventListener("keydown", fermerAvecEchap);

    return () => {
      window.removeEventListener("keydown", fermerAvecEchap);
    };
  }, [formulaireOuvert]);

  const categoriesAvecMontants = useMemo(() => {
    return categories.map((categorie) => {
      const transactionsCategorie = transactions.filter(
        (transaction) =>
          transaction.categorie?.trim().toLowerCase() ===
            categorie.nom.trim().toLowerCase() &&
          (categorie.type === "depense"
            ? Number(transaction.montant) < 0
            : Number(transaction.montant) > 0)
      );

      const total = transactionsCategorie.reduce(
        (somme, transaction) =>
          somme + Math.abs(Number(transaction.montant)),
        0
      );

      const progression =
        categorie.type === "depense" && categorie.budget > 0
          ? (total / categorie.budget) * 100
          : 0;

      return {
        ...categorie,
        total,
        progression,
        nombreTransactions: transactionsCategorie.length,
      };
    });
  }, [categories, transactions]);

  const depensesTotales = transactions
    .filter((transaction) => Number(transaction.montant) < 0)
    .reduce(
      (somme, transaction) =>
        somme + Math.abs(Number(transaction.montant)),
      0
    );

  const budgetTotal = categories
    .filter((categorie) => categorie.type === "depense")
    .reduce(
      (somme, categorie) => somme + Number(categorie.budget),
      0
    );

  const progressionGlobale =
    budgetTotal > 0 ? (depensesTotales / budgetTotal) * 100 : 0;

  const categoriesFiltrees = categoriesAvecMontants.filter((categorie) => {
  // Masquer les catégories sans transactions
  if (
  categorie.nombreTransactions === 0 &&
  !categorie.personnalisee
) {
  return false;
}

  const correspondRecherche = categorie.nom
    .toLowerCase()
    .includes(recherche.toLowerCase());

  const correspondFiltre =
    filtre === "toutes" || categorie.type === filtre;

  return correspondRecherche && correspondFiltre;
});



  function ouvrirAjout() {
    setCategorieModifiee(null);
    setNom("");
    setType("depense");
    setCouleur("#8ba58e");
    setBudget("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(categorie) {
    setCategorieModifiee(categorie);
    setNom(categorie.nom);
    setType(categorie.type);
    setCouleur(categorie.couleur);
    setBudget(String(categorie.budget));
    setFormulaireOuvert(true);
  }

  function enregistrerCategorie(event) {
    event.preventDefault();

    const nomNettoye = nom.trim();
    const budgetNombre = Number(budget || 0);

    if (!nomNettoye) {
      setMessage("Le nom de la catégorie est obligatoire.");
      return;
    }

    if (!Number.isFinite(budgetNombre) || budgetNombre < 0) {
      setMessage("Le budget doit être un nombre positif ou nul.");
      return;
    }

    const existeDeja = categories.some(
      (categorie) =>
        categorie.nom.toLowerCase() === nomNettoye.toLowerCase() &&
        categorie.id !== categorieModifiee?.id
    );

    if (existeDeja) {
      setMessage("Cette catégorie existe déjà.");
      return;
    }

    if (categorieModifiee) {
      const ancienNom = categorieModifiee.nom;

      setCategories((anciennes) =>
        anciennes.map((categorie) =>
          categorie.id === categorieModifiee.id
            ? {
                ...categorie,
                nom: nomNettoye,
                type,
                couleur,
                budget: type === "revenu" ? 0 : budgetNombre,
              }
            : categorie
        )
      );

      if (setTransactions && ancienNom !== nomNettoye) {
        setTransactions((anciennes) =>
          anciennes.map((transaction) =>
            transaction.categorie === ancienNom
              ? { ...transaction, categorie: nomNettoye }
              : transaction
          )
        );
      }

      setMessage("Catégorie modifiée avec succès.");
    } else {
      const nouvelleCategorie = {
  id: crypto.randomUUID(),
  nom: nomNettoye,
  type,
  couleur,
  budget: type === "revenu" ? 0 : budgetNombre,
  personnalisee: true,
};

      setCategories((anciennes) => [
        ...anciennes,
        nouvelleCategorie,
      ]);

      setMessage("Catégorie ajoutée avec succès.");
    }

    setFormulaireOuvert(false);
  }

  function supprimerCategorie(categorie) {
    const utilisee = transactions.some(
      (transaction) =>
        transaction.categorie?.toLowerCase() ===
        categorie.nom.toLowerCase()
    );

    if (utilisee) {
      setMessage(
        "Cette catégorie contient des transactions. Modifie leur catégorie avant de la supprimer."
      );
      return;
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la catégorie "${categorie.nom}" ?`
    );

    if (!confirmation) return;

    setCategories((anciennes) =>
      anciennes.filter((element) => element.id !== categorie.id)
    );

    setMessage("Catégorie supprimée avec succès.");
  }

  return (
    <div className="categories-page">
      <header className="categories-header">
        <div>
          <h1>Catégories</h1>
          <p>
            Gère tes catégories, suis tes dépenses et définis tes budgets.
          </p>
        </div>

        <button
          className="categories-btn-principal"
          onClick={ouvrirAjout}
        >
          + Ajouter une catégorie
        </button>
      </header>

      <section className="categories-resume">
        <article className="categories-stat">
          <span className="categories-stat-icone">◇</span>
          <div>
            <strong>{categories.length}</strong>
            <p>Catégories</p>
          </div>
        </article>

        <article className="categories-stat">
          <span className="categories-stat-icone">€</span>
          <div>
            <strong>{formaterMontant(depensesTotales)}</strong>
            <p>Dépenses totales</p>
          </div>
        </article>

        <article className="categories-stat">
          <span className="categories-stat-icone">◎</span>
          <div>
            <strong>{Math.round(progressionGlobale)} %</strong>
            <p>Du budget total utilisé</p>
          </div>
        </article>
      </section>

      <section className="categories-carte">
        <div className="categories-table-header">
          <div>
            <h2>Mes catégories</h2>
            <p>
              Retrouve tes dépenses et tes budgets par catégorie.
            </p>
          </div>

          <div className="categories-filtres">
            <input
              type="search"
              placeholder="Rechercher..."
              aria-label="Rechercher une catégorie"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
            />

            <select
              value={filtre}
              onChange={(event) => setFiltre(event.target.value)}
              aria-label="Filtrer les catégories"
            >
              <option value="toutes">Toutes</option>
              <option value="depense">Dépenses</option>
              <option value="revenu">Revenus</option>
            </select>
          </div>
        </div>

        <div className="categories-table-scroll">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Budget</th>
                <th>Progression</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categoriesFiltrees.map((categorie) => (
                <tr key={categorie.id}>
                  <td>
                    <div className="categories-nom">
                      <span
                        className="categories-pastille"
                        style={{
                          backgroundColor: categorie.couleur,
                        }}
                      >
                        {categorie.nom.charAt(0).toUpperCase()}
                      </span>

                      <span>{categorie.nom}</span>
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
                      {categorie.type === "revenu" ? "+" : ""}
                      {formaterMontant(categorie.total)}
                    </strong>
                  </td>

                  <td>
                    {categorie.type === "revenu"
                      ? "—"
                      : formaterMontant(categorie.budget)}
                  </td>

                  <td>
                    {categorie.type === "revenu" ||
                    categorie.budget === 0 ? (
                      <span className="categories-sans-budget">—</span>
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
                            }}
                          />
                        </div>

                        <span>
                          {Math.round(categorie.progression)} %
                        </span>
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="categories-actions">
                      <button
                        className="categories-action-modifier"
                        onClick={() => ouvrirModification(categorie)}
                        title={`Modifier ${categorie.nom}`}
                        aria-label={`Modifier ${categorie.nom}`}
                      >
                        ✎
                      </button>

                      <button
                        className="categories-action-supprimer"
                        onClick={() => supprimerCategorie(categorie)}
                        title={`Supprimer ${categorie.nom}`}
                        aria-label={`Supprimer ${categorie.nom}`}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categoriesFiltrees.length === 0 && (
            <p className="categories-vide">
              Aucune catégorie trouvée.
            </p>
          )}
        </div>

        <div className="categories-table-footer">
          {categoriesFiltrees.length} catégorie(s) affichée(s)
        </div>
      </section>

      {message && (
        <div className="categories-message" role="status">
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      {formulaireOuvert && (
        <div
          className="categories-modal-fond"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setFormulaireOuvert(false);
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
                <p>Personnalise ta catégorie.</p>
              </div>

              <button
                className="categories-modal-fermer"
                onClick={() => setFormulaireOuvert(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <form
              className="categories-formulaire"
              onSubmit={enregistrerCategorie}
            >
              <label htmlFor="categorie-nom">Nom</label>
              <input
                id="categorie-nom"
                type="text"
                placeholder="Ex : Shopping"
                value={nom}
                maxLength={35}
                onChange={(event) => setNom(event.target.value)}
                required
                autoFocus
              />

              <label htmlFor="categorie-type">Type</label>
              <select
                id="categorie-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="depense">Dépense</option>
                <option value="revenu">Revenu</option>
              </select>

              {type === "depense" && (
                <>
                  <label htmlFor="categorie-budget">
                    Budget prévu (€)
                  </label>

                  <input
                    id="categorie-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex : 250"
                    value={budget}
                    onChange={(event) =>
                      setBudget(event.target.value)
                    }
                  />
                </>
              )}

              <label htmlFor="categorie-couleur">Couleur</label>
              <div className="categories-choix-couleur">
                <input
                  id="categorie-couleur"
                  type="color"
                  value={couleur}
                  onChange={(event) =>
                    setCouleur(event.target.value)
                  }
                />
                <span>{couleur}</span>
              </div>

              <div className="categories-modal-actions">
                <button
                  type="button"
                  className="categories-btn-annuler"
                  onClick={() => setFormulaireOuvert(false)}
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
