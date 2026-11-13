
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./Accueil.css";
import Objectifs from "./pages/Objectifs";

import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Statistiques from "./pages/Statistiques";
import Categories from "./pages/Categories";
import Parametres from "./pages/Parametres";

const transactionsInitiales = [
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

const categoriesInitiales = [
  { id: "alimentation", nom: "Alimentation", type: "depense", couleur: "#8ba58e", budget: 400 },
  { id: "logement", nom: "Logement", type: "depense", couleur: "#a98ad0", budget: 1000 },
  { id: "transport", nom: "Transport", type: "depense", couleur: "#79b3c6", budget: 200 },
  { id: "loisirs", nom: "Loisirs", type: "depense", couleur: "#e7bb6a", budget: 150 },
  { id: "sante", nom: "Santé", type: "depense", couleur: "#dd8b86", budget: 100 },
  { id: "shopping", nom: "Shopping", type: "depense", couleur: "#c8b8a4", budget: 200 },
  { id: "abonnements", nom: "Abonnements", type: "depense", couleur: "#739e8c", budget: 100 },
  { id: "autre-depense", nom: "Autre", type: "depense", couleur: "#9caaa0", budget: 100 },
  { id: "revenus", nom: "Revenus", type: "revenu", couleur: "#65a777", budget: 0 },
  { id: "salaire", nom: "Salaire", type: "revenu", couleur: "#65a777", budget: 0 },
  { id: "prime", nom: "Prime", type: "revenu", couleur: "#81b59a", budget: 0 },
  { id: "cadeau", nom: "Cadeau", type: "revenu", couleur: "#a98ad0", budget: 0 },
  { id: "remboursement", nom: "Remboursement", type: "revenu", couleur: "#79b3c6", budget: 0 },
  { id: "autre-revenu", nom: "Autre", type: "revenu", couleur: "#e7bb6a", budget: 0 },
];

const navigation = [
  { id: "accueil", nom: "Accueil", icone: "⌂" },
  { id: "transactions", nom: "Transactions", icone: "⇄" },
  { id: "budgets", nom: "Budgets", icone: "◴" },
  { id: "objectifs", nom: "Objectifs", icone: "◎" },
  { id: "statistiques", nom: "Statistiques", icone: "▥" },
  { id: "categories", nom: "Catégories", icone: "◇" },
  { id: "parametres", nom: "Paramètres", icone: "⚙" },
];

function lireStockage(cle, valeurInitiale) {
  try {
    const valeur = localStorage.getItem(cle);

    if (valeur === null) {
      return valeurInitiale;
    }

    const resultat = JSON.parse(valeur);

    return Array.isArray(resultat)
      ? resultat
      : valeurInitiale;
  } catch {
    return valeurInitiale;
  }
}

function chargerCategories() {
  const categories = lireStockage(
    "moneyflow-categories",
    categoriesInitiales
  );

  // On respecte les catégories déjà enregistrées,
  // y compris celles que l'utilisateur a supprimées.
  if (
    localStorage.getItem("moneyflow-categories-v2") === "true"
  ) {
    return categories;
  }

  const categoriesCompletes = [
    ...categories,
    ...categoriesInitiales.filter(
      (initiale) =>
        !categories.some(
          (existante) =>
            existante.id === initiale.id ||
            (
              existante.nom.toLowerCase() ===
                initiale.nom.toLowerCase() &&
              existante.type === initiale.type
            )
        )
    ),
  ];

  localStorage.setItem("moneyflow-categories-v2", "true");

  return categoriesCompletes;
}

function euros(valeur) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(valeur);
}

function formaterDate(date) {
  if (!date) return "";

  const [annee, mois, jour] = date.split("-");

  return `${jour}/${mois}/${annee}`;
}

function identifiantUnique() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function App() {
  const [transactions, setTransactions] = useState(() =>
    lireStockage("transactions", transactionsInitiales)
  );

  const [categories, setCategories] = useState(chargerCategories);

  const [objectifs, setObjectifs] = useState(() =>
    lireStockage("moneyflow-objectifs", [])
  );

  const [prenomUtilisateur, setPrenomUtilisateur] = useState(
    () => localStorage.getItem("moneyflow-nom") || ""
  );

  const [pageActive, setPageActive] = useState(() => {
    const page = window.location.hash.replace("#", "");

    return navigation.some((element) => element.id === page)
      ? page
      : "accueil";
  });

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [modalObjectif, setModalObjectif] = useState(false);

  const [nomObjectif, setNomObjectif] = useState("");
  const [montantObjectif, setMontantObjectif] = useState("");
  const [montantEconomise, setMontantEconomise] = useState("");
  const [erreurObjectif, setErreurObjectif] = useState("");

  // SAUVEGARDE

  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-categories",
      JSON.stringify(categories)
    );
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-objectifs",
      JSON.stringify(objectifs)
    );
  }, [objectifs]);

  // NAVIGATION

  useEffect(() => {
    function synchroniserNavigation() {
      const page = window.location.hash.replace("#", "");

      if (navigation.some((element) => element.id === page)) {
        setPageActive(page);
      } else {
        setPageActive("accueil");
      }
    }

    window.addEventListener(
      "hashchange",
      synchroniserNavigation
    );

    return () =>
      window.removeEventListener(
        "hashchange",
        synchroniserNavigation
      );
  }, []);

  function naviguer(page) {
    setPageActive(page);
    setMenuOuvert(false);
    window.location.hash = page;
  }

  // CALCULS FINANCIERS

  const aujourdHui = new Date();

  const moisCourant = [
    aujourdHui.getFullYear(),
    String(aujourdHui.getMonth() + 1).padStart(2, "0"),
  ].join("-");

  const dateMoisPrecedent = new Date(
    aujourdHui.getFullYear(),
    aujourdHui.getMonth() - 1,
    1
  );

  const moisPrecedent = [
    dateMoisPrecedent.getFullYear(),
    String(dateMoisPrecedent.getMonth() + 1).padStart(2, "0"),
  ].join("-");

  const transactionsMois = useMemo(
    () =>
      transactions.filter((transaction) =>
        transaction.date?.startsWith(moisCourant)
      ),
    [transactions, moisCourant]
  );

  const transactionsMoisPrecedent = useMemo(
    () =>
      transactions.filter((transaction) =>
        transaction.date?.startsWith(moisPrecedent)
      ),
    [transactions, moisPrecedent]
  );

  function calculerTotaux(liste) {
    return liste.reduce(
      (resultat, transaction) => {
        const montant = Number(transaction.montant);

        if (!Number.isFinite(montant)) {
          return resultat;
        }

        if (montant > 0) {
          resultat.revenus += montant;
        } else if (montant < 0) {
          resultat.depenses += Math.abs(montant);
        }

        return resultat;
      },
      { revenus: 0, depenses: 0 }
    );
  }

  const totaux = calculerTotaux(transactions);
  const totauxMois = calculerTotaux(transactionsMois);
  const totauxPrecedents = calculerTotaux(
    transactionsMoisPrecedent
  );

  const soldeActuel = totaux.revenus - totaux.depenses;

  const budgetTotal = categories
    .filter((categorie) => categorie.type === "depense")
    .reduce(
      (total, categorie) =>
        total + (Number(categorie.budget) || 0),
      0
    );

  const budgetRestant =
    budgetTotal - totauxMois.depenses;

  function calculerVariation(actuel, precedent) {
    if (precedent === 0) return null;

    return ((actuel - precedent) / precedent) * 100;
  }

  const variationDepenses = calculerVariation(
    totauxMois.depenses,
    totauxPrecedents.depenses
  );

  const variationRevenus = calculerVariation(
    totauxMois.revenus,
    totauxPrecedents.revenus
  );

  const soldeMois =
    totauxMois.revenus - totauxMois.depenses;

  const soldePrecedent =
    totauxPrecedents.revenus - totauxPrecedents.depenses;

  const variationSolde = calculerVariation(
    soldeMois,
    soldePrecedent
  );

  // BUDGETS RESPECTÉS

  const categoriesAvecBudget = categories.filter(
    (categorie) =>
      categorie.type === "depense" &&
      Number(categorie.budget) > 0
  );

  const budgetsRespectes = categoriesAvecBudget.filter(
    (categorie) => {
      const depenseCategorie = transactionsMois
        .filter(
          (transaction) =>
            Number(transaction.montant) < 0 &&
            transaction.categorie?.toLowerCase() ===
              categorie.nom.toLowerCase()
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.montant)),
          0
        );

      return depenseCategorie <= Number(categorie.budget);
    }
  ).length;

  // TRANSACTIONS RÉCENTES

  const transactionsRecentes = useMemo(
    () =>
      [...transactions]
        .sort((a, b) =>
          String(b.date).localeCompare(String(a.date))
        )
        .slice(0, 4),
    [transactions]
  );

  // OBJECTIFS

  function ajouterObjectif(event) {
    event.preventDefault();

    const nom = nomObjectif.trim();
    const cible = Number(montantObjectif);
    const economise = Number(montantEconomise || 0);

    if (!nom) {
      setErreurObjectif("Saisis un nom pour ton objectif.");
      return;
    }

    if (!Number.isFinite(cible) || cible <= 0) {
      setErreurObjectif(
        "Le montant à atteindre doit être supérieur à 0."
      );
      return;
    }

    if (
      !Number.isFinite(economise) ||
      economise < 0 ||
      economise > cible
    ) {
      setErreurObjectif(
        "Le montant économisé doit être compris entre 0 et le montant cible."
      );
      return;
    }

    const nouvelObjectif = {
      id: identifiantUnique(),
      nom,
      cible,
      economise,
    };

    setObjectifs((anciens) => [
      ...anciens,
      nouvelObjectif,
    ]);

    setNomObjectif("");
    setMontantObjectif("");
    setMontantEconomise("");
    setErreurObjectif("");
    setModalObjectif(false);
  }

  function ajouterEpargne(objectif) {
    const saisie = window.prompt(
      `Combien souhaites-tu ajouter à « ${objectif.nom} » ?`
    );

    if (saisie === null) return;

    const montant = Number(saisie.replace(",", "."));

    if (!Number.isFinite(montant) || montant <= 0) {
      window.alert("Saisis un montant positif.");
      return;
    }

    if (objectif.economise + montant > objectif.cible) {
      window.alert(
        "Le montant dépasse la somme restante pour cet objectif."
      );
      return;
    }

    setObjectifs((anciens) =>
      anciens.map((element) =>
        element.id === objectif.id
          ? {
              ...element,
              economise: element.economise + montant,
            }
          : element
      )
    );
  }

  function supprimerObjectif(id) {
    const confirmation = window.confirm(
      "Supprimer cet objectif d'épargne ?"
    );

    if (!confirmation) return;

    setObjectifs((anciens) =>
      anciens.filter((objectif) => objectif.id !== id)
    );
  }

  // COMPOSANTS VISUELS

  function afficherVariation(variation, inverse = false) {
    if (variation === null) {
      return (
        <span className="mf-variation neutre">
          Pas de comparaison disponible
        </span>
      );
    }

    const positif = variation >= 0;
    const favorable = inverse ? !positif : positif;

    return (
      <span
        className={`mf-variation ${
          favorable ? "positive" : "negative"
        }`}
      >
        {positif ? "↑" : "↓"}{" "}
        {Math.abs(variation).toFixed(1).replace(".", ",")} %
        <small> vs mois dernier</small>
      </span>
    );
  }

  function carteObjectif(objectif) {
    const progression = Math.min(
      (objectif.economise / objectif.cible) * 100,
      100
    );

    return (
      <article className="mf-objectif" key={objectif.id}>
        <div className="mf-objectif-icone">◎</div>

        <div className="mf-objectif-contenu">
          <div className="mf-objectif-haut">
            <strong>{objectif.nom}</strong>

            <button
              type="button"
              className="mf-icon-button"
              title="Supprimer l'objectif"
              onClick={() => supprimerObjectif(objectif.id)}
            >
              ×
            </button>
          </div>

          <p>
            {euros(objectif.economise)} /{" "}
            {euros(objectif.cible)}
          </p>

          <div className="mf-progression-ligne">
            <div className="mf-barre">
              <div
                style={{
                  width: `${progression}%`,
                }}
              />
            </div>

            <span>{Math.round(progression)} %</span>
          </div>

          <button
            type="button"
            className="mf-ajouter-epargne"
            onClick={() => ajouterEpargne(objectif)}
          >
            + Ajouter de l'épargne
          </button>
        </div>
      </article>
    );
  }

  // PAGE ACCUEIL

  function afficherAccueil() {
    return (
      <div className="mf-accueil">
        <header className="mf-entete">
          <div>
            <span className="mf-sur-titre">
              MON TABLEAU DE BORD
            </span>

            <h1>
              Bonjour
              {prenomUtilisateur
                ? ` ${prenomUtilisateur}`
                : ""}
              ! <span>✳</span>
            </h1>

            <p>
              Voici un aperçu de tes finances ce mois-ci.
            </p>
          </div>

          <button
            type="button"
            className="mf-bouton-principal"
            onClick={() => naviguer("transactions")}
          >
            + Nouvelle transaction
          </button>
        </header>

        {/* CARTES FINANCIÈRES */}

        <section className="mf-cartes-finances">
          <article className="mf-carte-finance">
            <div className="mf-carte-haut">
              <span className="mf-carte-icone solde">
                ◇
              </span>
              <span>Solde actuel</span>
            </div>

            <strong>{euros(soldeActuel)}</strong>

            {afficherVariation(variationSolde)}
          </article>

          <article className="mf-carte-finance">
            <div className="mf-carte-haut">
              <span className="mf-carte-icone revenus">
                ↗
              </span>
              <span>Revenus du mois</span>
            </div>

            <strong>{euros(totauxMois.revenus)}</strong>

            {afficherVariation(variationRevenus)}
          </article>

          <article className="mf-carte-finance">
            <div className="mf-carte-haut">
              <span className="mf-carte-icone depenses">
                ↘
              </span>
              <span>Dépenses du mois</span>
            </div>

            <strong>{euros(totauxMois.depenses)}</strong>

            {afficherVariation(variationDepenses, true)}
          </article>

          <article className="mf-carte-finance budget">
            <div className="mf-carte-haut">
              <span className="mf-carte-icone budget">
                ◎
              </span>
              <span>Budget restant</span>
            </div>

            <strong
              className={
                budgetRestant < 0 ? "mf-negatif" : ""
              }
            >
              {euros(budgetRestant)}
            </strong>

            <span className="mf-carte-detail">
              Sur un budget de {euros(budgetTotal)}
            </span>
          </article>
        </section>

        {/* EN UN COUP D'ŒIL */}

        <section className="mf-section mf-apercu">
          <div className="mf-section-entete">
            <div>
              <h2>✧ En un coup d'œil</h2>
              <p>
                Les informations importantes de ton mois.
              </p>
            </div>

            <button
              className="mf-lien"
              onClick={() => naviguer("statistiques")}
            >
              Voir les statistiques →
            </button>
          </div>

          <div className="mf-analyses">
            <article className="mf-analyse alerte">
              <span className="mf-analyse-icone">
                ↗
              </span>

              <div>
                <h3>
                  {variationDepenses === null
                    ? "Suivi des dépenses"
                    : variationDepenses > 0
                      ? "Dépenses en hausse"
                      : "Dépenses maîtrisées"}
                </h3>

                <p>
                  {variationDepenses === null
                    ? "Ajoute des transactions sur deux mois pour comparer tes dépenses."
                    : variationDepenses > 0
                      ? `Tes dépenses ont augmenté de ${Math.abs(
                          variationDepenses
                        ).toFixed(1)} % par rapport au mois dernier.`
                      : variationDepenses < 0
                        ? `Tes dépenses ont diminué de ${Math.abs(
                            variationDepenses
                          ).toFixed(1)} % par rapport au mois dernier.`
                        : "Tes dépenses sont identiques à celles du mois dernier."}
                </p>
              </div>
            </article>

            <article className="mf-analyse reussite">
              <span className="mf-analyse-icone">
                ✓
              </span>

              <div>
                <h3>Mes budgets</h3>

                <p>
                  {categoriesAvecBudget.length === 0
                    ? "Crée des budgets pour suivre tes dépenses."
                    : `${budgetsRespectes} budget(s) respecté(s) sur ${categoriesAvecBudget.length} ce mois-ci.`}
                </p>
              </div>
            </article>

            <article className="mf-analyse conseil">
              <span className="mf-analyse-icone">
                ✦
              </span>

              <div>
                <h3>Le conseil du mois</h3>

                <p>
                  {budgetRestant < 0
                    ? `Tu as dépassé ton budget mensuel de ${euros(
                        Math.abs(budgetRestant)
                      )}. Consulte tes budgets pour identifier les catégories concernées.`
                    : objectifs.length > 0
                      ? "Tu peux suivre tes projets d'épargne dans la rubrique Objectifs."
                      : "Crée ton premier objectif d'épargne pour préparer un projet qui te tient à cœur."}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* OBJECTIFS ET TRANSACTIONS */}

        <div className="mf-bas-accueil">
          <section className="mf-section mf-objectifs-section">
            <div className="mf-section-entete">
              <div>
                <h2>◎ Mes objectifs</h2>
                <p>
                  Économise pour tes projets.
                </p>
              </div>

              <button
                className="mf-lien"
                onClick={() => naviguer("objectifs")}
              >
                Voir tout →
              </button>
            </div>

            {objectifs.length === 0 ? (
              <div className="mf-vide">
                <span>✧</span>
                <h3>Ton prochain projet commence ici</h3>
                <p>
                  Vacances, ordinateur, permis...
                  Fixe-toi un objectif et suis ton épargne.
                </p>
              </div>
            ) : (
              <div className="mf-liste-objectifs">
                {objectifs.slice(0, 2).map(carteObjectif)}
              </div>
            )}

            <button
              className="mf-bouton-ajout"
              onClick={() => setModalObjectif(true)}
            >
              + Ajouter un objectif
            </button>
          </section>

          <section className="mf-section mf-transactions-section">
            <div className="mf-section-entete">
              <div>
                <h2>⇄ Dernières transactions</h2>
                <p>
                  Tes opérations les plus récentes.
                </p>
              </div>

              <button
                className="mf-lien"
                onClick={() => naviguer("transactions")}
              >
                Voir tout →
              </button>
            </div>

            {transactionsRecentes.length === 0 ? (
              <div className="mf-vide">
                <p>Aucune transaction pour le moment.</p>
              </div>
            ) : (
              <div className="mf-liste-transactions">
                {transactionsRecentes.map((transaction) => {
                  const estDepense =
                    Number(transaction.montant) < 0;

                  return (
                    <article
                      className="mf-transaction"
                      key={transaction.id}
                    >
                      <span
                        className={`mf-transaction-icone ${
                          estDepense ? "sortie" : "entree"
                        }`}
                      >
                        {estDepense ? "↗" : "↙"}
                      </span>

                      <div className="mf-transaction-infos">
                        <strong>{transaction.nom}</strong>
                        <small>
                          {transaction.categorie}
                        </small>
                      </div>

                      <div className="mf-transaction-montant">
                        <strong
                          className={
                            estDepense
                              ? "mf-montant-negatif"
                              : "mf-montant-positif"
                          }
                        >
                          {!estDepense ? "+" : ""}
                          {euros(Number(transaction.montant))}
                        </strong>

                        <small>
                          {formaterDate(transaction.date)}
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // PAGE OBJECTIFS

  function afficherObjectifs() {
    return (
      <div className="mf-accueil mf-page-objectifs">
        <header className="mf-entete">
          <div>
            <span className="mf-sur-titre">
              MES PROJETS
            </span>

            <h1>Mes objectifs d'épargne</h1>

            <p>
              Organise tes projets et suis leur progression.
            </p>
          </div>

          <button
            className="mf-bouton-principal"
            onClick={() => setModalObjectif(true)}
          >
            + Nouvel objectif
          </button>
        </header>

        {objectifs.length === 0 ? (
          <section className="mf-section mf-vide">
            <span>◎</span>
            <h2>Aucun objectif pour le moment</h2>
            <p>
              Ajoute ton premier projet pour commencer à
              suivre ton épargne.
            </p>

            <button
              className="mf-bouton-principal"
              onClick={() => setModalObjectif(true)}
            >
              Créer un objectif
            </button>
          </section>
        ) : (
          <div className="mf-grille-objectifs">
            {objectifs.map(carteObjectif)}
          </div>
        )}

        <p className="mf-note-epargne">
          Les montants économisés sont suivis séparément
          de tes transactions : ils ne sont pas déduits
          automatiquement de ton solde bancaire.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`app ${
        pageActive === "budgets"
          ? "app-budgets"
          : pageActive === "transactions"
            ? "app-transactions"
            : ""
      }`}
    >
      {/* SIDEBAR */}

      <aside className="sidebar mf-sidebar">
        <div className="mf-logo">
          <span className="mf-logo-symbole">◈</span>
          <h2>MoneyFlow</h2>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>

        <nav
          className={
            menuOuvert
              ? "nav-links ouvert"
              : "nav-links"
          }
        >
          {navigation.map((element) => (
            <a
              key={element.id}
              href={`#${element.id}`}
              className={
                pageActive === element.id
                  ? "lien-actif"
                  : ""
              }
              onClick={(event) => {
                event.preventDefault();
                naviguer(element.id);
              }}
            >
              <span className="mf-nav-icone">
                {element.icone}
              </span>

              {element.nom}
            </a>
          ))}
        </nav>

        <div className="mf-sidebar-decoration">
          ✧
        </div>
      </aside>

      {/* PAGES */}

      <main className="main-content">
        {pageActive === "accueil" ? (
          afficherAccueil()
        ) : pageActive === "transactions" ? (
          <Transactions
            transactions={transactions}
            setTransactions={setTransactions}
            categories={categories}
          />
        ) : pageActive === "budgets" ? (
          <Budgets
            transactions={transactions}
            categories={categories}
            setCategories={setCategories}
          />
        ) : pageActive === "objectifs" ? (
        <Objectifs objectifs={objectifs} setObjectifs={setObjectifs} />
        ) : pageActive === "statistiques" ? (
          <Statistiques
            transactions={transactions}
            categories={categories}
          />
        ) : pageActive === "categories" ? (
          <Categories
            transactions={transactions}
            setTransactions={setTransactions}
            categories={categories}
            setCategories={setCategories}
          />
        ) : pageActive === "parametres" ? (
          <Parametres
            transactions={transactions}
            setTransactions={setTransactions}
            setPrenomUtilisateur={setPrenomUtilisateur}
          />
        ) : null}
      </main>

      {/* MODALE NOUVEL OBJECTIF */}

      {modalObjectif && (
        <div
          className="mf-modal-fond"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalObjectif(false);
            }
          }}
        >
          <div
            className="mf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mf-modal-titre"
          >
            <div className="mf-modal-entete">
              <div>
                <h2 id="mf-modal-titre">
                  Nouvel objectif
                </h2>

                <p>
                  Quel projet souhaites-tu financer ?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalObjectif(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <form onSubmit={ajouterObjectif}>
              <label htmlFor="mf-nom-objectif">
                Nom de l'objectif
              </label>

              <input
                id="mf-nom-objectif"
                type="text"
                placeholder="Ex : Vacances"
                value={nomObjectif}
                maxLength={50}
                onChange={(event) =>
                  setNomObjectif(event.target.value)
                }
                required
              />

              <label htmlFor="mf-montant-cible">
                Montant à atteindre (€)
              </label>

              <input
                id="mf-montant-cible"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex : 1500"
                value={montantObjectif}
                onChange={(event) =>
                  setMontantObjectif(event.target.value)
                }
                required
              />

              <label htmlFor="mf-deja-economise">
                Montant déjà économisé (€)
              </label>

              <input
                id="mf-deja-economise"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex : 200"
                value={montantEconomise}
                onChange={(event) =>
                  setMontantEconomise(event.target.value)
                }
              />

              {erreurObjectif && (
                <p className="mf-erreur">
                  {erreurObjectif}
                </p>
              )}

              <div className="mf-modal-actions">
                <button
                  type="button"
                  className="mf-bouton-secondaire"
                  onClick={() => setModalObjectif(false)}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="mf-bouton-principal"
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
