
import { useMemo, useState } from "react";
import "./Categories.css";

const COULEURS = [
  "#8ba58e",
  "#a98ad0",
  "#79b3c6",
  "#e7bb6a",
  "#dd8b86",
  "#c8b8a4",
  "#739e8c",
  "#9caaa0",
];

const ICONES = [
  { symbole: "🛒", nom: "Courses" },
  { symbole: "⌂", nom: "Maison" },
  { symbole: "🚗", nom: "Transport" },
  { symbole: "✈", nom: "Voyage" },
  { symbole: "♡", nom: "Santé" },
  { symbole: "🎮", nom: "Loisirs" },
  { symbole: "✦", nom: "Autre" },
  { symbole: "€", nom: "Argent" },
  { symbole: "☕", nom: "Restaurant" },
  { symbole: "▣", nom: "Shopping" },
  { symbole: "♫", nom: "Musique" },
  { symbole: "✎", nom: "Études" },
];

const ICONES_DEFAUT = {
  alimentation: "🛒",
  logement: "⌂",
  transport: "🚗",
  loisirs: "🎮",
  sante: "♡",
  shopping: "▣",
  abonnements: "♫",
  revenus: "€",
  salaire: "€",
  prime: "✦",
  cadeau: "🎁",
  remboursement: "↩",
};

const euros = (valeur) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valeur) || 0);

function creerId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function Categories({
  transactions = [],
  setTransactions,
  categories = [],
  setCategories,
}) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState("depense");
  const [icone, setIcone] = useState("🛒");
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [filtre, setFiltre] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [categorieModifiee, setCategorieModifiee] =
    useState(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const moisActuel = new Date().toISOString().slice(0, 7);

  const transactionsMois = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          typeof transaction.date === "string" &&
          transaction.date.slice(0, 7) === moisActuel
      ),
    [transactions, moisActuel]
  );

  const totalDepenses = transactionsMois
    .filter((transaction) => Number(transaction.montant) < 0)
    .reduce(
      (total, transaction) =>
        total + Math.abs(Number(transaction.montant)),
      0
    );

  const totalRevenus = transactionsMois
    .filter((transaction) => Number(transaction.montant) > 0)
    .reduce(
      (total, transaction) =>
        total + Number(transaction.montant),
      0
    );

  const categoriesFiltrees = categories.filter((categorie) => {
    const correspondType =
      filtre === "toutes" || categorie.type === filtre;

    const correspondRecherche = categorie.nom
      .toLocaleLowerCase("fr")
      .includes(recherche.trim().toLocaleLowerCase("fr"));

    return correspondType && correspondRecherche;
  });

  function transactionsCategorie(categorie) {
    return transactionsMois.filter(
      (transaction) =>
        transaction.categorie === categorie.nom &&
        (categorie.type === "depense"
          ? Number(transaction.montant) < 0
          : Number(transaction.montant) > 0)
    );
  }

  function montantCategorie(categorie) {
    return transactionsCategorie(categorie).reduce(
      (total, transaction) =>
        total + Math.abs(Number(transaction.montant)),
      0
    );
  }

  function reinitialiserFormulaire() {
    setNom("");
    setType("depense");
    setIcone("🛒");
    setCouleur(COULEURS[0]);
    setCategorieModifiee(null);
    setErreur("");
  }

  function commencerModification(categorie) {
    setCategorieModifiee(categorie);
    setNom(categorie.nom);
    setType(categorie.type);
    setIcone(
      categorie.icone ||
        ICONES_DEFAUT[categorie.id] ||
        "✦"
    );
    setCouleur(categorie.couleur || COULEURS[0]);
    setErreur("");
    setMessage("");
  }

  function enregistrerCategorie(event) {
    event.preventDefault();
    setErreur("");
    setMessage("");

    const nouveauNom = nom.trim();

    if (!nouveauNom) {
      setErreur("Indique un nom pour ta catégorie.");
      return;
    }

    const doublon = categories.some(
      (categorie) =>
        categorie.id !== categorieModifiee?.id &&
        categorie.type === type &&
        categorie.nom.toLocaleLowerCase("fr") ===
          nouveauNom.toLocaleLowerCase("fr")
    );

    if (doublon) {
      setErreur("Cette catégorie existe déjà pour ce type.");
      return;
    }

    if (categorieModifiee) {
      const ancienNom = categorieModifiee.nom;
      const ancienType = categorieModifiee.type;

      const transactionsLiees = transactions.filter(
        (transaction) =>
          transaction.categorie === ancienNom &&
          (ancienType === "depense"
            ? Number(transaction.montant) < 0
            : Number(transaction.montant) > 0)
      );

      if (
        ancienType !== type &&
        transactionsLiees.length > 0
      ) {
        setErreur(
          "Impossible de changer le type : cette catégorie possède déjà des transactions."
        );
        return;
      }

      setCategories((precedentes) =>
        precedentes.map((categorie) =>
          categorie.id === categorieModifiee.id
            ? {
                ...categorie,
                nom: nouveauNom,
                type,
                icone,
                couleur,
                budget:
                  type === "revenu"
                    ? 0
                    : Number(categorie.budget) || 0,
              }
            : categorie
        )
      );

      if (
        ancienNom !== nouveauNom &&
        typeof setTransactions === "function"
      ) {
        setTransactions((precedentes) =>
          precedentes.map((transaction) =>
            transaction.categorie === ancienNom &&
            (ancienType === "depense"
              ? Number(transaction.montant) < 0
              : Number(transaction.montant) > 0)
              ? {
                  ...transaction,
                  categorie: nouveauNom,
                }
              : transaction
          )
        );
      }

      reinitialiserFormulaire();
      setMessage("Catégorie modifiée avec succès.");
      return;
    }

    setCategories((precedentes) => [
      ...precedentes,
      {
        id: creerId(),
        nom: nouveauNom,
        type,
        icone,
        couleur,
        budget: 0,
      },
    ]);

    reinitialiserFormulaire();
    setMessage("Nouvelle catégorie ajoutée !");
  }

  function supprimerCategorie(categorie) {
    const utilisee = transactions.some(
      (transaction) =>
        transaction.categorie === categorie.nom &&
        (categorie.type === "depense"
          ? Number(transaction.montant) < 0
          : Number(transaction.montant) > 0)
    );

    if (utilisee) {
      setErreur(
        `Impossible de supprimer « ${categorie.nom} » : des transactions utilisent cette catégorie.`
      );
      setMessage("");
      return;
    }

    if (
      !window.confirm(
        `Supprimer définitivement la catégorie « ${categorie.nom} » ?`
      )
    ) {
      return;
    }

    setCategories((precedentes) =>
      precedentes.filter(
        (element) => element.id !== categorie.id
      )
    );

    if (categorieModifiee?.id === categorie.id) {
      reinitialiserFormulaire();
    }

    setErreur("");
    setMessage("Catégorie supprimée.");
  }

  return (
    <div className="cat-page">
      <header className="cat-header">
        <div>
          <span className="cat-sur-titre">
            MES FINANCES
          </span>
          <h1>Catégories <span>◇</span></h1>
          <p>
            Organise tes dépenses et tes revenus avec tes
            propres catégories.
          </p>
        </div>

        <div className="cat-resume">
          <div className="cat-resume-carte">
            <span className="cat-resume-icone">▤</span>
            <div>
              <strong>{categories.length}</strong>
              <p>catégories actives</p>
            </div>
          </div>

          <div className="cat-resume-carte">
            <span className="cat-resume-icone">↗</span>
            <div>
              <strong>{euros(totalRevenus)}</strong>
              <p>revenus ce mois</p>
            </div>
          </div>

          <div className="cat-resume-carte">
            <span className="cat-resume-icone">↘</span>
            <div>
              <strong>{euros(totalDepenses)}</strong>
              <p>dépenses ce mois</p>
            </div>
          </div>
        </div>
      </header>

      <div className="cat-contenu">
        <section className="cat-formulaire-carte">
          <div className="cat-section-entete">
            <div className="cat-section-icone">⊕</div>
            <div>
              <h2>
                {categorieModifiee
                  ? "Modifier une catégorie"
                  : "Ajouter une catégorie"}
              </h2>
              <p>
                Personnalise tes catégories selon tes besoins.
              </p>
            </div>
          </div>

          <form
            className="cat-formulaire"
            onSubmit={enregistrerCategorie}
          >
            <label htmlFor="cat-nom">
              Nom de la catégorie
            </label>
            <input
              id="cat-nom"
              type="text"
              value={nom}
              maxLength={35}
              onChange={(event) => setNom(event.target.value)}
              placeholder="Ex. : Voyages"
            />

            <label>Type</label>
            <div className="cat-types">
              <button
                type="button"
                className={
                  type === "depense" ? "actif" : ""
                }
                onClick={() => setType("depense")}
              >
                − Dépense
              </button>

              <button
                type="button"
                className={
                  type === "revenu" ? "actif" : ""
                }
                onClick={() => setType("revenu")}
              >
                + Revenu
              </button>
            </div>

            <label>Icône</label>
            <div className="cat-icones">
              {ICONES.map((element) => (
                <button
                  key={element.nom}
                  type="button"
                  title={element.nom}
                  aria-label={element.nom}
                  aria-pressed={icone === element.symbole}
                  className={
                    icone === element.symbole ? "actif" : ""
                  }
                  onClick={() => setIcone(element.symbole)}
                >
                  {element.symbole}
                </button>
              ))}
            </div>

            <label>Couleur</label>
            <div className="cat-couleurs">
              {COULEURS.map((element) => (
                <button
                  key={element}
                  type="button"
                  aria-label={`Choisir la couleur ${element}`}
                  aria-pressed={couleur === element}
                  className={
                    couleur === element ? "actif" : ""
                  }
                  style={{ backgroundColor: element }}
                  onClick={() => setCouleur(element)}
                />
              ))}
            </div>

            {erreur && (
              <p className="cat-erreur" role="alert">
                {erreur}
              </p>
            )}

            {message && (
              <p className="cat-succes" role="status">
                {message}
              </p>
            )}

            <button
              className="cat-btn-enregistrer"
              type="submit"
            >
              {categorieModifiee
                ? "✓ Enregistrer les modifications"
                : "+ Ajouter la catégorie"}
            </button>

            {categorieModifiee && (
              <button
                className="cat-btn-annuler"
                type="button"
                onClick={reinitialiserFormulaire}
              >
                Annuler la modification
              </button>
            )}
          </form>
        </section>

        <section className="cat-liste-carte">
          <div className="cat-liste-entete">
            <div className="cat-section-entete">
              <div className="cat-section-icone">▤</div>
              <div>
                <h2>Mes catégories</h2>
                <p>
                  Retrouve et personnalise tes catégories.
                </p>
              </div>
            </div>

            <select
              value={filtre}
              onChange={(event) =>
                setFiltre(event.target.value)
              }
              aria-label="Filtrer les catégories"
            >
              <option value="toutes">Toutes</option>
              <option value="depense">Dépenses</option>
              <option value="revenu">Revenus</option>
            </select>
          </div>

          <input
            className="cat-recherche"
            type="search"
            placeholder="Rechercher une catégorie..."
            value={recherche}
            onChange={(event) =>
              setRecherche(event.target.value)
            }
          />

          <div className="cat-tableau-conteneur">
            <table className="cat-tableau">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Type</th>
                  <th>Couleur</th>
                  <th>Total ce mois</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categoriesFiltrees.map((categorie) => (
                  <tr key={categorie.id}>
                    <td>
                      <div className="cat-identite">
                        <span
                          className="cat-ligne-icone"
                          style={{
                            backgroundColor:
                              categorie.couleur ||
                              COULEURS[0],
                          }}
                        >
                          {categorie.icone ||
                            ICONES_DEFAUT[categorie.id] ||
                            "✦"}
                        </span>

                        <strong>{categorie.nom}</strong>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`cat-badge ${categorie.type}`}
                      >
                        {categorie.type === "revenu"
                          ? "Revenu"
                          : "Dépense"}
                      </span>
                    </td>

                    <td>
                      <span
                        className="cat-pastille"
                        style={{
                          backgroundColor:
                            categorie.couleur ||
                            COULEURS[0],
                        }}
                      />
                    </td>

                    <td className="cat-montant">
                      {euros(montantCategorie(categorie))}
                    </td>

                    <td>
                      <div className="cat-actions">
                        <button
                          type="button"
                          className="cat-action-modifier"
                          title="Modifier"
                          aria-label={`Modifier ${categorie.nom}`}
                          onClick={() =>
                            commencerModification(categorie)
                          }
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="cat-action-supprimer"
                          title="Supprimer"
                          aria-label={`Supprimer ${categorie.nom}`}
                          onClick={() =>
                            supprimerCategorie(categorie)
                          }
                        >
                          ♜
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categoriesFiltrees.length === 0 && (
              <div className="cat-vide">
                Aucune catégorie trouvée.
              </div>
            )}
          </div>

          <div className="cat-liste-footer">
            {categoriesFiltrees.length} catégorie(s) affichée(s)
            <span>
              Les montants correspondent au mois en cours.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Categories;
