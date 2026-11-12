import "./App.css";
import Parametres from "./pages/Parametres";
import Categories from "./pages/Categories";
import Statistiques from "./pages/Statistiques";
import { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// TRANSACTIONS DE DÉPART

const transactionsData = [
  {
    id: 1,
    nom: "courses",
    categorie: "Alimentation",
    montant: -65,
    date: "2026-11-26",
  },
  {
    id: 2,
    nom: "Salaire",
    categorie: "Revenus",
    montant: 2500,
    date: "2026-11-17",
  },
  {
    id: 3,
    nom: "Loyer",
    categorie: "Logement",
    montant: -900,
    date: "2026-11-06",
  },
];

// CATÉGORIES DE DÉPART

const categoriesInitiales = [
  {
    id: "alimentation",
    nom: "Alimentation",
    type: "depense",
    couleur: "#8ba58e",
    budget: 400,
  },
  {
    id: "logement",
    nom: "Logement",
    type: "depense",
    couleur: "#a98ad0",
    budget: 1000,
  },
  {
    id: "transport",
    nom: "Transport",
    type: "depense",
    couleur: "#79b3c6",
    budget: 200,
  },
  {
    id: "loisirs",
    nom: "Loisirs",
    type: "depense",
    couleur: "#e7bb6a",
    budget: 150,
  },
  {
    id: "sante",
    nom: "Santé",
    type: "depense",
    couleur: "#dd8b86",
    budget: 100,
  },
  {
    id: "shopping",
    nom: "Shopping",
    type: "depense",
    couleur: "#c8b8a4",
    budget: 200,
  },
  {
    id: "abonnements",
    nom: "Abonnements",
    type: "depense",
    couleur: "#739e8c",
    budget: 100,
  },
  {
    id: "autre-depense",
    nom: "Autre",
    type: "depense",
    couleur: "#9caaa0",
    budget: 100,
  },
  {
    id: "revenus",
    nom: "Revenus",
    type: "revenu",
    couleur: "#65a777",
    budget: 0,
  },
  {
    id: "salaire",
    nom: "Salaire",
    type: "revenu",
    couleur: "#65a777",
    budget: 0,
  },
  {
    id: "prime",
    nom: "Prime",
    type: "revenu",
    couleur: "#81b59a",
    budget: 0,
  },
  {
    id: "cadeau",
    nom: "Cadeau",
    type: "revenu",
    couleur: "#a98ad0",
    budget: 0,
  },
  {
    id: "remboursement",
    nom: "Remboursement",
    type: "revenu",
    couleur: "#79b3c6",
    budget: 0,
  },
  {
    id: "autre-revenu",
    nom: "Autre",
    type: "revenu",
    couleur: "#e7bb6a",
    budget: 0,
  },
];

const COLORS = ["#455d50", "#8ba58e", "#c8b8a4", "#e8ede4"];

// CHARGEMENT DES CATÉGORIES

function chargerCategories() {
  try {
    const sauvegarde = localStorage.getItem("moneyflow-categories");

    if (sauvegarde !== null) {
      const donnees = JSON.parse(sauvegarde);

      if (Array.isArray(donnees)) {
        // Restaure les catégories manquantes une seule fois,
        // puis respecte les modifications et suppressions.
        if (localStorage.getItem("moneyflow-categories-v2") !== "true") {
          const categoriesCompletes = [
            ...donnees,
            ...categoriesInitiales.filter(
              (initiale) =>
                !donnees.some(
                  (existante) =>
                    existante.id === initiale.id ||
                    (existante.nom.toLowerCase() ===
                      initiale.nom.toLowerCase() &&
                      existante.type === initiale.type)
                )
            ),
          ];

          localStorage.setItem("moneyflow-categories-v2", "true");
          return categoriesCompletes;
        }

        return donnees;
      }
    }
  } catch (erreur) {
    console.error("Erreur de chargement des catégories :", erreur);
  }

  localStorage.setItem("moneyflow-categories-v2", "true");
  return categoriesInitiales;
}

// APPLICATION

function App() {
  // TRANSACTIONS

  const [transactions, setTransactions] = useState(() => {
    try {
      const sauvegarde = localStorage.getItem("transactions");

      if (sauvegarde !== null) {
        const donnees = JSON.parse(sauvegarde);
        if (Array.isArray(donnees)) return donnees;
      }
    } catch (erreur) {
      console.error("Erreur de chargement des transactions :", erreur);
    }

    return transactionsData;
  });

  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [typeTransaction, setTypeTransaction] = useState("depense");

  // NAVIGATION

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [pageActive, setPageActive] = useState("accueil");

  const [prenomUtilisateur, setPrenomUtilisateur] = useState(
    () => localStorage.getItem("moneyflow-nom") || ""
  );

  // CATÉGORIES SYNCHRONISÉES

  const [categories, setCategories] = useState(chargerCategories);

  const categoriesDepenses = categories
    .filter((cat) => cat.type === "depense")
    .map((cat) => cat.nom);

  const categoriesRevenus = categories
    .filter((cat) => cat.type === "revenu")
    .map((cat) => cat.nom);

  // BUDGET

  const [budget, setBudget] = useState(() => {
    const sauvegarde = localStorage.getItem("budget");
    return sauvegarde !== null ? Number(sauvegarde) : 1200;
  });

  const [nouveauBudget, setNouveauBudget] = useState(String(budget));

  // MODIFICATION DES TRANSACTIONS

  const [transactionEnModification, setTransactionEnModification] =
    useState(null);

  const [nomModifie, setNomModifie] = useState("");
  const [montantModifie, setMontantModifie] = useState("");
  const [categorieModifiee, setCategorieModifiee] = useState("");
  const [typeModifie, setTypeModifie] = useState("depense");
  const [erreurModification, setErreurModification] = useState("");

  // RECHERCHE ET FILTRES

  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("tous");
  const [erreur, setErreur] = useState("");

  // SAUVEGARDE AUTOMATIQUE

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-categories",
      JSON.stringify(categories)
    );
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("budget", String(budget));
  }, [budget]);

  // AJOUTER UNE TRANSACTION

  function ajouterTransaction() {
    if (!nom.trim()) {
      setErreur("Veuillez saisir un nom de transaction.");
      return;
    }

    if (!categorie.trim()) {
      setErreur("Veuillez sélectionner une catégorie.");
      return;
    }

    if (
      montant.trim() === "" ||
      !Number.isFinite(Number(montant)) ||
      Number(montant) <= 0
    ) {
      setErreur("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    const aujourdhui = new Date();

    const annee = aujourdhui.getFullYear();
    const mois = String(aujourdhui.getMonth() + 1).padStart(2, "0");
    const jour = String(aujourdhui.getDate()).padStart(2, "0");

    const dateComplete = `${annee}-${mois}-${jour}`;

    const nouvelleTransaction = {
      id: crypto.randomUUID(),
      nom: nom.trim(),
      categorie: categorie.trim(),
      montant:
        typeTransaction === "depense"
          ? -Math.abs(Number(montant))
          : Math.abs(Number(montant)),
      date: dateComplete,
    };

    setTransactions((anciennes) => [
      ...anciennes,
      nouvelleTransaction,
    ]);

    setNom("");
    setMontant("");
    setCategorie("");
    setErreur("");
  }

  // SUPPRIMER UNE TRANSACTION

  function supprimerTransaction(id) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette transaction ?"
    );

    if (!confirmation) return;

    setTransactions((anciennes) =>
      anciennes.filter((transaction) => transaction.id !== id)
    );
  }

  // MODIFIER LE BUDGET

  function modifierBudget() {
    if (
      nouveauBudget.trim() === "" ||
      !Number.isFinite(Number(nouveauBudget)) ||
      Number(nouveauBudget) < 0
    ) {
      return;
    }

    setBudget(Number(nouveauBudget));
  }

  // COMMENCER LA MODIFICATION

  function commencerModification(transaction) {
    setTransactionEnModification(transaction.id);
    setNomModifie(transaction.nom);
    setMontantModifie(String(Math.abs(transaction.montant)));
    setCategorieModifiee(transaction.categorie);
    setTypeModifie(
      transaction.montant < 0 ? "depense" : "revenu"
    );
    setErreurModification("");
  }

  function annulerModification() {
    setTransactionEnModification(null);
    setErreurModification("");
  }

  // ENREGISTRER LA MODIFICATION

  function enregistrerModification(id) {
    if (!nomModifie.trim()) {
      setErreurModification("Veuillez saisir un nom.");
      return;
    }

    if (!categorieModifiee.trim()) {
      setErreurModification("Veuillez choisir une catégorie.");
      return;
    }

    if (
      montantModifie.trim() === "" ||
      !Number.isFinite(Number(montantModifie)) ||
      Number(montantModifie) <= 0
    ) {
      setErreurModification(
        "Veuillez saisir un montant supérieur à 0."
      );
      return;
    }

    const transactionsModifiees = transactions.map((transaction) => {
      if (transaction.id === id) {
        return {
          ...transaction,
          nom: nomModifie.trim(),
          categorie: categorieModifiee,
          montant:
            typeModifie === "depense"
              ? -Math.abs(Number(montantModifie))
              : Math.abs(Number(montantModifie)),
        };
      }

      return transaction;
    });

    setTransactions(transactionsModifiees);
    setTransactionEnModification(null);
    setErreurModification("");
  }

  // CALCUL DES DÉPENSES

  const transactionDepenses = transactions.filter(
    (transaction) => transaction.montant < 0
  );

  const depensesParCategorie = transactionDepenses.reduce(
    (accumulateur, transaction) => {
      const nomCategorie = transaction.categorie;

      if (!accumulateur[nomCategorie]) {
        accumulateur[nomCategorie] = 0;
      }

      accumulateur[nomCategorie] += Math.abs(transaction.montant);

      return accumulateur;
    },
    {}
  );

  const depensesRegroupees = Object.entries(
    depensesParCategorie
  ).map(([nomCategorie, montantCategorie]) => ({
    categorie: nomCategorie,
    montant: montantCategorie,
  }));

  const depenses = transactionDepenses.reduce(
    (total, transaction) => total + Math.abs(transaction.montant),
    0
  );

  // CALCUL DES REVENUS

  const transactionRevenus = transactions.filter(
    (transaction) => transaction.montant > 0
  );

  const revenus = transactionRevenus.reduce(
    (total, transaction) => total + transaction.montant,
    0
  );

  const soldeActuel = revenus - depenses;
  const budgetRestant = budget - depenses;

  // TRI ET RECHERCHE

  const transactionsTriees = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const transactionsFiltrees = transactionsTriees.filter(
    (transaction) => {
      const correspondRecherche =
        transaction.nom
          .toLowerCase()
          .includes(recherche.toLowerCase()) ||
        transaction.categorie
          .toLowerCase()
          .includes(recherche.toLowerCase());

      const correspondType =
        filtreType === "tous" ||
        (filtreType === "depense" && transaction.montant < 0) ||
        (filtreType === "revenu" && transaction.montant > 0);

      return correspondRecherche && correspondType;
    }
  );

  const transactionsRecentes = [...transactionsFiltrees]
    .reverse()
    .slice(0, 5);

  // ÉVOLUTION DU SOLDE

  const transactionsParJour = transactionsTriees.reduce(
    (accumulateur, transaction) => {
      if (!accumulateur[transaction.date]) {
        accumulateur[transaction.date] = 0;
      }

      accumulateur[transaction.date] += transaction.montant;

      return accumulateur;
    },
    {}
  );

  let soldeCumule = 0;

  const evolutionSolde = Object.entries(transactionsParJour).map(
    ([date, montantJour]) => {
      soldeCumule += montantJour;

      return {
        date,
        solde: soldeCumule,
      };
    }
  );

  // AFFICHAGE

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>MoneyFlow</h2>

        <button
          className="menu-toggle"
          onClick={() => setMenuOuvert(!menuOuvert)}
        >
          ☰
        </button>

        <nav className={menuOuvert ? "nav-links ouvert" : "nav-links"}>
          <a
            href="#accueil"
            onClick={() => setPageActive("accueil")}
            className={
              pageActive === "accueil" ? "lien-actif" : ""
            }
          >
            Accueil
          </a>

          <a href="#transactions">Transactions</a>

          <a href="#budgets">Budgets</a>

          <a href="#statistiques" onClick={() => setPageActive("statistiques")}
  className={pageActive === "statistiques" ? "lien-actif" : ""}>Statistiques</a>

          <a
            href="#categories"
            onClick={() => setPageActive("categories")}
            className={
              pageActive === "categories" ? "lien-actif" : ""
            }
          >
            Catégories
          </a>

          <a
            href="#parametres"
            onClick={() => setPageActive("parametres")}
            className={
              pageActive === "parametres" ? "lien-actif" : ""
            }
          >
            Paramètres
          </a>
        </nav>
      </aside>

      <main className="main-content">
        {pageActive === "parametres" ? (
          <Parametres
            transactions={transactions}
            setTransactions={setTransactions}
            setPrenomUtilisateur={setPrenomUtilisateur}
          />
        ) : pageActive === "categories" ? (
          <Categories
            transactions={transactions}
            setTransactions={setTransactions}
            categories={categories}
            setCategories={setCategories}
           />
  ) : pageActive === "statistiques" ? (
    <Statistiques transactions={transactions} />
  ) : (
    <>
          
            <h1>
              Bonjour
              {prenomUtilisateur
                ? `, ${prenomUtilisateur}`
                : ""}{" "}
              !
            </h1>

            <p>Voici un aperçu de tes finances</p>

            {/* CARTES STATISTIQUES */}

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Solde actuel</h3>
                <p>{soldeActuel.toLocaleString("fr-FR")} €</p>
              </div>

              <div className="stat-card">
                <h3>Dépenses</h3>
                <p>{depenses.toLocaleString("fr-FR")} €</p>
              </div>

              <div className="stat-card">
                <h3>Revenus</h3>
                <p>{revenus.toLocaleString("fr-FR")} €</p>
              </div>

              <div className="stat-card">
                <h3>Budget restant</h3>

                <p
                  className={
                    budgetRestant < 0
                      ? "budget-danger"
                      : "budget-success"
                  }
                >
                  {budgetRestant.toLocaleString("fr-FR")} €
                </p>

                <p
                  className={
                    budgetRestant < 0
                      ? "budget-danger"
                      : "budget-success"
                  }
                >
                  {budgetRestant < 0
                    ? "Budget dépassé"
                    : "Budget respecté"}
                </p>

                <div className="budget-form">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Nouveau budget"
                    value={nouveauBudget}
                    onChange={(event) =>
                      setNouveauBudget(event.target.value)
                    }
                  />

                  <button onClick={modifierBudget}>
                    Modifier
                  </button>
                </div>
              </div>
            </div>

            {/* GRAPHIQUES */}

            <div className="charts-grid">
              <div className="chart-card">
                <h2>Évolution de ton solde</h2>

                {evolutionSolde.length === 0 ? (
                  <p>Aucune transaction pour le moment</p>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={evolutionSolde}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e9e1"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          date.slice(8, 10) +
                          "/" +
                          date.slice(5, 7)
                        }
                      />

                      <YAxis />
                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="solde"
                        stroke="#455d50"
                        strokeWidth={3}
                        dot={{ fill: "#8ba58e", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <h2>Répartition des dépenses</h2>

                {depensesRegroupees.length === 0 ? (
                  <p>Aucune dépense pour le moment</p>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={depensesRegroupees}
                        dataKey="montant"
                        nameKey="categorie"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                      >
                        {depensesRegroupees.map(
                          (depense, index) => (
                            <Cell
                              key={depense.categorie}
                              fill={
                                categories.find(
                                  (cat) =>
                                    cat.nom === depense.categorie &&
                                    cat.type === "depense"
                                )?.couleur ||
                                COLORS[index % COLORS.length]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) =>
                          `${value} - ${(
                            depensesParCategorie[value] || 0
                          ).toLocaleString("fr-FR")} €`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* AJOUTER UNE TRANSACTION */}

            <div className="ajout-card">
              <h2>Ajouter une transaction</h2>

              <input
                type="text"
                placeholder="Nom de la transaction"
                value={nom}
                onChange={(event) => setNom(event.target.value)}
              />

              <input
                type="number"
                placeholder="Montant en €"
                min="0.01"
                step="0.01"
                value={montant}
                onChange={(event) => setMontant(event.target.value)}
              />

              <select
                value={typeTransaction}
                onChange={(event) => {
                  setTypeTransaction(event.target.value);
                  setCategorie("");
                }}
              >
                <option value="depense">Dépense</option>
                <option value="revenu">Revenu</option>
              </select>

              <select
                value={categorie}
                onChange={(event) => setCategorie(event.target.value)}
              >
                <option value="">Choisir une catégorie</option>

                {(typeTransaction === "depense"
                  ? categoriesDepenses
                  : categoriesRevenus
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button onClick={ajouterTransaction}>
                Ajouter une transaction
              </button>

              {erreur && (
                <p className="message-erreur">{erreur}</p>
              )}
            </div>

            {/* TRANSACTIONS RÉCENTES */}

            <div className="transactions-card">
              <h2>Transactions récentes</h2>

              <div className="transactions-filtres">
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={recherche}
                  onChange={(event) =>
                    setRecherche(event.target.value)
                  }
                />

                <select
                  value={filtreType}
                  onChange={(event) =>
                    setFiltreType(event.target.value)
                  }
                >
                  <option value="tous">Toutes</option>
                  <option value="depense">Dépenses</option>
                  <option value="revenu">Revenus</option>
                </select>
              </div>

              {transactionsRecentes.length === 0 ? (
                <p>Aucune transaction trouvée.</p>
              ) : (
                transactionsRecentes.map((transaction) => (
                  <div
                    className="transaction-item"
                    key={transaction.id}
                  >
                    {transactionEnModification ===
                    transaction.id ? (
                      <div className="modification-form">
                        <input
                          type="text"
                          placeholder="Nom"
                          value={nomModifie}
                          onChange={(event) =>
                            setNomModifie(event.target.value)
                          }
                        />

                        <input
                          type="number"
                          placeholder="Montant"
                          min="0.01"
                          step="0.01"
                          value={montantModifie}
                          onChange={(event) =>
                            setMontantModifie(event.target.value)
                          }
                        />

                        <select
                          value={typeModifie}
                          onChange={(event) => {
                            setTypeModifie(event.target.value);
                            setCategorieModifiee("");
                          }}
                        >
                          <option value="depense">Dépense</option>
                          <option value="revenu">Revenu</option>
                        </select>

                        <select
                          value={categorieModifiee}
                          onChange={(event) =>
                            setCategorieModifiee(event.target.value)
                          }
                        >
                          <option value="">
                            Choisir une catégorie
                          </option>

                          {(typeModifie === "depense"
                            ? categoriesDepenses
                            : categoriesRevenus
                          ).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}

                          {categorieModifiee !== "" &&
                            !(typeModifie === "depense"
                              ? categoriesDepenses
                              : categoriesRevenus
                            ).includes(categorieModifiee) && (
                              <option value={categorieModifiee}>
                                {categorieModifiee}
                              </option>
                            )}
                        </select>

                        {erreurModification && (
                          <p className="message-erreur">
                            {erreurModification}
                          </p>
                        )}

                        <div className="transaction-actions">
                          <button
                            className="bouton-enregistrer"
                            onClick={() =>
                              enregistrerModification(
                                transaction.id
                              )
                            }
                          >
                            Enregistrer
                          </button>

                          <button
                            className="bouton-annuler"
                            onClick={annulerModification}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="transaction-infos">
                          <p className="transaction-nom">
                            {transaction.nom}
                          </p>

                          <p className="transaction-categorie">
                            {transaction.categorie}
                          </p>

                          <p
                            className={
                              transaction.montant < 0
                                ? "montant-negatif"
                                : "montant-positif"
                            }
                          >
                            {transaction.montant.toLocaleString(
                              "fr-FR"
                            )}{" "}
                            €
                          </p>

                          <p className="transaction-date">
                            {transaction.date.slice(8, 10) +
                              "/" +
                              transaction.date.slice(5, 7) +
                              "/" +
                              transaction.date.slice(0, 4)}
                          </p>
                        </div>

                        <div className="transaction-actions">
                          <button
                            className="bouton-modifier"
                            onClick={() =>
                              commencerModification(transaction)
                            }
                          >
                            Modifier
                          </button>

                          <button
                            className="bouton-supprimer"
                            onClick={() =>
                              supprimerTransaction(transaction.id)
                            }
                          >
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
        
      </main>
    </div>
  );
}

export default App;