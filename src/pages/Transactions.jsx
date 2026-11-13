
import { useMemo, useState } from "react";
import "./Transactions.css";

const formaterMontant = (montant) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);

function Transactions({
  transactions = [],
  setTransactions,
  categories = [],
}) {
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("toutes");
  const [filtrePeriode, setFiltrePeriode] = useState("tout");

  const [modalOuverte, setModalOuverte] = useState(false);
  const [transactionModifiee, setTransactionModifiee] =
    useState(null);

  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [type, setType] = useState("depense");
  const [categorie, setCategorie] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [erreur, setErreur] = useState("");

  const categoriesDisponibles = useMemo(() => {
    const categoriesFiltrees = categories.filter(
      (item) => item.type === type
    );

    const noms = categoriesFiltrees.map((item) => item.nom);

    if (categorie && !noms.includes(categorie)) {
      noms.push(categorie);
    }

    return [...new Set(noms)];
  }, [categories, type, categorie]);

  const statistiques = useMemo(() => {
    const revenus = transactions
      .filter((transaction) => Number(transaction.montant) > 0)
      .reduce(
        (total, transaction) =>
          total + Number(transaction.montant),
        0
      );

    const depenses = transactions
      .filter((transaction) => Number(transaction.montant) < 0)
      .reduce(
        (total, transaction) =>
          total + Math.abs(Number(transaction.montant)),
        0
      );

    return {
      revenus,
      depenses,
      solde: revenus - depenses,
    };
  }, [transactions]);

  const transactionsFiltrees = useMemo(() => {
    const maintenant = new Date();

    return [...transactions]
      .filter((transaction) => {
        const montantTransaction = Number(transaction.montant);

        if (filtreType === "depense" && montantTransaction >= 0) {
          return false;
        }

        if (filtreType === "revenu" && montantTransaction <= 0) {
          return false;
        }

        const dateTransaction = new Date(
          `${transaction.date}T12:00:00`
        );

        if (filtrePeriode === "mois") {
          if (
            dateTransaction.getMonth() !== maintenant.getMonth() ||
            dateTransaction.getFullYear() !==
              maintenant.getFullYear()
          ) {
            return false;
          }
        }

        if (filtrePeriode === "annee") {
          if (
            dateTransaction.getFullYear() !==
            maintenant.getFullYear()
          ) {
            return false;
          }
        }

        const texte = `${transaction.nom} ${transaction.categorie}`
          .toLowerCase();

        return texte.includes(recherche.trim().toLowerCase());
      })
      .sort((a, b) => {
        const comparaisonDate = b.date.localeCompare(a.date);

        if (comparaisonDate !== 0) {
          return comparaisonDate;
        }

        return Number(b.id) - Number(a.id);
      });
  }, [transactions, recherche, filtreType, filtrePeriode]);

  const groupes = useMemo(() => {
    const groupesParDate = {};

    transactionsFiltrees.forEach((transaction) => {
      const dateTransaction = transaction.date;

      if (!groupesParDate[dateTransaction]) {
        groupesParDate[dateTransaction] = [];
      }

      groupesParDate[dateTransaction].push(transaction);
    });

    return Object.entries(groupesParDate).map(
      ([dateGroupe, elements]) => ({
        date: dateGroupe,
        transactions: elements,
      })
    );
  }, [transactionsFiltrees]);

  function formaterDate(dateTexte) {
    const dateObjet = new Date(`${dateTexte}T12:00:00`);

    if (Number.isNaN(dateObjet.getTime())) {
      return dateTexte;
    }

    return dateObjet.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function changerType(nouveauType) {
    setType(nouveauType);
    setCategorie("");
  }

  function ouvrirAjout() {
    setTransactionModifiee(null);
    setNom("");
    setMontant("");
    setType("depense");
    setCategorie("");
    setDate(new Date().toLocaleDateString("en-CA"));
    setErreur("");
    setModalOuverte(true);
  }

  function ouvrirModification(transaction) {
    setTransactionModifiee(transaction);
    setNom(transaction.nom);
    setMontant(String(Math.abs(Number(transaction.montant))));
    setType(
      Number(transaction.montant) < 0 ? "depense" : "revenu"
    );
    setCategorie(transaction.categorie);
    setDate(transaction.date);
    setErreur("");
    setModalOuverte(true);
  }

  function fermerModal() {
    setModalOuverte(false);
    setTransactionModifiee(null);
    setErreur("");
  }

  function enregistrerTransaction(event) {
    event.preventDefault();

    const montantNumerique = Number(montant);

    if (
      !nom.trim() ||
      !categorie ||
      !date ||
      !Number.isFinite(montantNumerique) ||
      montantNumerique <= 0
    ) {
      setErreur("Merci de remplir correctement tous les champs.");
      return;
    }

    const montantFinal =
      type === "depense"
        ? -Math.abs(montantNumerique)
        : Math.abs(montantNumerique);

    if (transactionModifiee) {
      setTransactions((anciennes) =>
        anciennes.map((transaction) =>
          transaction.id === transactionModifiee.id
            ? {
                ...transaction,
                nom: nom.trim(),
                montant: montantFinal,
                categorie,
                date,
              }
            : transaction
        )
      );
    } else {
      const nouvelleTransaction = {
        id: Date.now(),
        nom: nom.trim(),
        montant: montantFinal,
        categorie,
        date,
      };

      setTransactions((anciennes) => [
        ...anciennes,
        nouvelleTransaction,
      ]);
    }

    fermerModal();
  }

  function supprimerTransaction(transaction) {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer « ${transaction.nom} » ?`
    );

    if (!confirmation) {
      return;
    }

    setTransactions((anciennes) =>
      anciennes.filter(
        (element) => element.id !== transaction.id
      )
    );
  }

  return (
    <div className="transactions-page">
      <header className="transactions-page-header">
        <div>
          <h1>Historique</h1>
          <p>Retrouve et organise toutes tes opérations.</p>
        </div>

        <button
          className="transactions-ajouter"
          onClick={ouvrirAjout}
        >
          + Nouvelle transaction
        </button>
      </header>

      <section className="transactions-solde">
        <div className="transactions-solde-decoration" />

        <div className="transactions-solde-contenu">
          <span className="transactions-solde-label">
            Solde des transactions
          </span>

          <h2>{formaterMontant(statistiques.solde)}</h2>

          <div className="transactions-solde-details">
            <div>
              <span className="transactions-detail-icone positif">
                ↗
              </span>
              <span>
                {formaterMontant(statistiques.revenus)} reçus
              </span>
            </div>

            <div>
              <span className="transactions-detail-icone negatif">
                ↘
              </span>
              <span>
                {formaterMontant(statistiques.depenses)} dépensés
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="transactions-historique">
        <div className="transactions-historique-header">
          <div>
            <h2>Mes opérations</h2>
            <p>
              {transactionsFiltrees.length} transaction(s)
              affichée(s)
            </p>
          </div>

          <div className="transactions-recherche">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Rechercher une transaction..."
              value={recherche}
              onChange={(event) =>
                setRecherche(event.target.value)
              }
            />
          </div>
        </div>

        <div className="transactions-outils">
          <div className="transactions-types">
            <button
              className={
                filtreType === "toutes" ? "actif" : ""
              }
              onClick={() => setFiltreType("toutes")}
            >
              Toutes
            </button>

            <button
              className={
                filtreType === "depense" ? "actif" : ""
              }
              onClick={() => setFiltreType("depense")}
            >
              Dépenses
            </button>

            <button
              className={
                filtreType === "revenu" ? "actif" : ""
              }
              onClick={() => setFiltreType("revenu")}
            >
              Revenus
            </button>
          </div>

          <select
            value={filtrePeriode}
            onChange={(event) =>
              setFiltrePeriode(event.target.value)
            }
            aria-label="Filtrer par période"
          >
            <option value="tout">Toutes les périodes</option>
            <option value="mois">Ce mois-ci</option>
            <option value="annee">Cette année</option>
          </select>
        </div>

        <div className="transactions-historique-liste">
          {groupes.length === 0 ? (
            <div className="transactions-historique-vide">
              <h3>Aucune transaction trouvée</h3>
              <p>
                Ajoute une opération ou modifie tes filtres.
              </p>
            </div>
          ) : (
            groupes.map((groupe) => (
              <div
                className="transactions-groupe"
                key={groupe.date}
              >
                <h3 className="transactions-date-groupe">
                  {formaterDate(groupe.date)}
                </h3>

                {groupe.transactions.map((transaction) => {
                  const estRevenu =
                    Number(transaction.montant) > 0;

                  return (
                    <article
                      className="transactions-operation"
                      key={transaction.id}
                    >
                      <div className="transactions-operation-gauche">
                        <div
                          className={`transactions-operation-icone ${
                            estRevenu ? "revenu" : "depense"
                          }`}
                        >
                          {estRevenu ? "↙" : "↗"}
                        </div>

                        <div className="transactions-operation-infos">
                          <h4>{transaction.nom}</h4>
                          <p>{transaction.categorie}</p>
                        </div>
                      </div>

                      <div className="transactions-operation-droite">
                        <strong
                          className={
                            estRevenu
                              ? "transactions-montant-revenu"
                              : "transactions-montant-depense"
                          }
                        >
                          {estRevenu ? "+" : ""}
                          {formaterMontant(
                            Number(transaction.montant)
                          )}
                        </strong>

                        <div className="transactions-operation-actions">
                          <button
                            onClick={() =>
                              ouvrirModification(transaction)
                            }
                            title="Modifier"
                            aria-label={`Modifier ${transaction.nom}`}
                          >
                            Modifier
                          </button>

                          <button
                            className="supprimer"
                            onClick={() =>
                              supprimerTransaction(transaction)
                            }
                            title="Supprimer"
                            aria-label={`Supprimer ${transaction.nom}`}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <footer className="transactions-historique-footer">
          <span>
            Historique de tes transactions
          </span>
          <span>
            Données synchronisées avec MoneyFlow
          </span>
        </footer>
      </section>

      {modalOuverte && (
        <div
          className="transactions-modal-fond"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerModal();
            }
          }}
        >
          <div
            className="transactions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transactions-modal-titre"
          >
            <div className="transactions-modal-header">
              <div>
                <h2 id="transactions-modal-titre">
                  {transactionModifiee
                    ? "Modifier la transaction"
                    : "Nouvelle transaction"}
                </h2>
                <p>Renseigne les informations de l'opération.</p>
              </div>

              <button
                className="transactions-modal-fermer"
                onClick={fermerModal}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <form onSubmit={enregistrerTransaction}>
              <div className="transactions-modal-types">
                <button
                  type="button"
                  className={
                    type === "depense" ? "actif" : ""
                  }
                  onClick={() => changerType("depense")}
                >
                  Dépense
                </button>

                <button
                  type="button"
                  className={
                    type === "revenu" ? "actif" : ""
                  }
                  onClick={() => changerType("revenu")}
                >
                  Revenu
                </button>
              </div>

              <label htmlFor="transaction-nom">
                Nom de la transaction
              </label>

              <input
                id="transaction-nom"
                type="text"
                placeholder="Ex : Courses"
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                required
              />

              <label htmlFor="transaction-montant">
                Montant (€)
              </label>

              <input
                id="transaction-montant"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={montant}
                onChange={(event) =>
                  setMontant(event.target.value)
                }
                required
              />

              <label htmlFor="transaction-categorie">
                Catégorie
              </label>

              <select
                id="transaction-categorie"
                value={categorie}
                onChange={(event) =>
                  setCategorie(event.target.value)
                }
                required
              >
                <option value="">Choisir une catégorie</option>

                {categoriesDisponibles.map((nomCategorie) => (
                  <option
                    value={nomCategorie}
                    key={nomCategorie}
                  >
                    {nomCategorie}
                  </option>
                ))}
              </select>

              <label htmlFor="transaction-date">
                Date
              </label>

              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
              />

              {erreur && (
                <p className="transactions-modal-erreur">
                  {erreur}
                </p>
              )}

              <div className="transactions-modal-actions">
                <button
                  type="button"
                  className="transactions-btn-annuler"
                  onClick={fermerModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="transactions-btn-enregistrer"
                >
                  {transactionModifiee
                    ? "Enregistrer"
                    : "Ajouter la transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
