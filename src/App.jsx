import './App.css';
import Parametres from "./pages/Parametres";
import {useState, useEffect} from "react";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';


  const transactionsData = [
     { id : 1,
     nom : "courses",
     categorie : "Alimentation" ,
     montant : -65,
     date: "2026-11-26"
    },
  
  {
    id : 2,
    nom : "Salaire",
    categorie : "Revenus",
    montant : 2500,
    date : "2026-11-17"
  },

  {
    id : 3, 
    nom : "Loyer",
    categorie : "Logement",
    montant : -900,
    date : "2026-11-06"
  }];


 



const COLORS = ['#455d50', '#8ba58e', '#c8b8a4', '#e8ede4'];

const categoriesDepenses = [
  "Alimentation",
  "Logement",
  "Transport",
  "Loisirs",
  "Santé",
  "Shopping",
  "Abonnements",
  "Autre"
];

const categoriesRevenus = [
  "Salaire",
  "Prime",
  "Cadeau",
  "Remboursement",
  "Autre"
];


function App(){
const [transactions, setTransactions] = useState(JSON.parse(localStorage.getItem("transactions")) || transactionsData);
  const [nom , setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [typeTransaction, setTypeTransaction] = useState("depense");
  const [menuOuvert , setMenuOuvert] = useState(false);
  const [erreur, setErreur] = useState("");
  const [pageActive, setPageActive] = useState("accueil");
  const [prenomUtilisateur, setPrenomUtilisateur] = useState(
  () => localStorage.getItem("moneyflow-nom") || ""
);
  const [budget, setBudget] = useState(() => {
  const budgetSauvegarde = localStorage.getItem("budget");
  return budgetSauvegarde !== null ? Number(budgetSauvegarde) : 1200;
});

const [nouveauBudget, setNouveauBudget] = useState(String(budget));

const [transactionEnModification, setTransactionEnModification] = useState(null);
const [nomModifie, setNomModifie] = useState("");
const [montantModifie, setMontantModifie] = useState("");
const [categorieModifiee, setCategorieModifiee] = useState("");
const [typeModifie, setTypeModifie] = useState("depense");
const [erreurModification, setErreurModification] = useState("");

const [recherche, setRecherche] = useState("");
const [filtreType, setFiltreType] = useState("tous");

useEffect(() =>{
  localStorage.setItem("transactions", JSON.stringify(transactions))
  
}, [transactions]);

useEffect(() => {
  localStorage.setItem("budget", String(budget));
}, [budget]);




  function ajouterTransaction() {
  const aujourdhui = new Date();
  const annee = aujourdhui.getFullYear();
  const mois = aujourdhui.getMonth() + 1;
  const jour = aujourdhui.getDate();

  const dateComplete = `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;

 
    const nouvelleTransaction = {
    id: Date.now(),
    nom: nom.trim(),
    categorie: categorie.trim(),
    montant: typeTransaction ==="depense" ? -Math.abs(Number(montant)) : Math.abs(Number(montant)),
    date: dateComplete
  }



    const transactionsExiste = transactions.some(
    (transaction)=> transaction.id === nouvelleTransaction.id
  );
    
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

setErreur("");

    if (!transactionsExiste){
    setTransactions([...transactions,nouvelleTransaction]);
    setNom("");
    setMontant("");
    setCategorie("");
    }
}

function supprimerTransaction(id) {
  const confirmation = window.confirm(
    "voulez vous vraiement supprimer cette transaction ? "
  );
  if (!confirmation){
    return; 
  }
  const transactionsFiltrees = transactions.filter(
    (transaction) => transaction.id !== id
  );

  setTransactions(transactionsFiltrees);
}

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

function commencerModification(transaction) {
  setTransactionEnModification(transaction.id);
  setNomModifie(transaction.nom);
  setMontantModifie(String(Math.abs(transaction.montant)));
  setCategorieModifiee(transaction.categorie);
  setTypeModifie(transaction.montant < 0 ? "depense" : "revenu");
  setErreurModification("");
}

function annulerModification() {
  setTransactionEnModification(null);
  setErreurModification("");
}

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
    setErreurModification("Veuillez saisir un montant supérieur à 0.");
    return;
  }

  const transactionsModifiees = transactions.map((transaction) => {
    if (transaction.id === id) {
      return {
        ...transaction,
        nom: nomModifie.trim(),
        categorie: categorieModifiee,
        montant: typeModifie === "depense"
          ? -Math.abs(Number(montantModifie))
          : Math.abs(Number(montantModifie))
      };
    }

    return transaction;
  });

  setTransactions(transactionsModifiees);
  setTransactionEnModification(null);
  setErreurModification("");
}



  
  const transactionDepenses = transactions.filter ((transaction) => (
    transaction.montant < 0 ))

const depensesParCategorie = transactionDepenses.reduce((accumulateur,transaction)=> {
  const categorie = transaction.categorie;
  if (!accumulateur[categorie]){
    accumulateur[categorie] = 0;
  }  
  accumulateur[categorie] += Math.abs(transaction.montant) 
  return accumulateur;
}, {});

  const depensesRegroupees = Object.entries (depensesParCategorie).map(([categorie, montant])=>({
    categorie: categorie,
    montant: montant
  }),
);

  const depenses= Math.abs( transactionDepenses.reduce ((total,transaction) => {
return total + transaction.montant;
}, 0));
  
  const transactionRevenus = transactions.filter((transaction)=>
transaction.montant > 0 )

  const revenus= transactionRevenus.reduce((totale , transaction)=>{
  return totale + transaction.montant
} , 0 );


  const soldeActuel = revenus - depenses
  const budgetRestant = budget - depenses

  




  const transactionTriees = transactions.toSorted((a,b)=> a.date.localeCompare(b.date))
const transactionsFiltrees = transactionTriees.filter((transaction) => {
  const correspondRecherche =
    transaction.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    transaction.categorie.toLowerCase().includes(recherche.toLowerCase());

  const correspondType =
    filtreType === "tous" ||
    (filtreType === "depense" && transaction.montant < 0) ||
    (filtreType === "revenu" && transaction.montant > 0);

  return correspondRecherche && correspondType;
});

const transactionRecentes = transactionsFiltrees.toReversed().slice(0, 5);
  const transactionsParJour = transactionTriees.reduce((acc, transaction) => {
  if (!acc[transaction.date]) {
    acc[transaction.date] = 0;
  }

  acc[transaction.date] += transaction.montant;

  return acc;
}, {});

let soldeCumule = 0; 

const evolutionSolde = Object.entries(transactionsParJour).map(([date, montant]) =>{
  soldeCumule +=montant; 
  return{
    date: date,
    solde: soldeCumule
  };
});

return (
<div className='app'>
  <aside className='sidebar'>
    <h2>MoneyFlow</h2>
    <button className="menu-toggle"onClick={() => setMenuOuvert(!menuOuvert)}>  ☰ </button>
    <nav className ={menuOuvert ? "nav-links ouvert" : "nav-links"}>
      <a href="#accueil" onClick={() => setPageActive("accueil")}
  className={pageActive === "accueil" ? "lien-actif" : ""}>Accueil</a>
      <a href="#transactions">Transactions</a>
      <a href="#budgets">Budgets</a>
      <a href="#statistiques">Statistiques</a>
      <a href="#categories">Catégories</a>
      <a href="#parametres"  onClick={() => setPageActive("parametres")}
  className={pageActive === "parametres" ? "lien-actif" : ""}>Paramètres</a>

    </nav>
  </aside>
  <main className='main-content'>
      {pageActive === "parametres" ? (
   <Parametres
  transactions={transactions}
  setTransactions={setTransactions}
  setPrenomUtilisateur={setPrenomUtilisateur}
/>
  ) : (
    <>
  <h1>  Bonjour{prenomUtilisateur ? `, ${prenomUtilisateur}` : ""} !</h1>
  <p>Voici un apercu de tes finances</p>

<div className ='stats-grid'>
  <div className ='stat-card'>
    <h3>Solde actuel</h3>
    <p>{soldeActuel.toLocaleString('fr-FR')} €</p>
  </div>

  <div className ='stat-card'>
    <h3>Dépenses</h3>
    <p>{depenses.toLocaleString ('fr-FR')} €</p>
  </div>

  <div className ='stat-card'>
    <h3>Revenus</h3>
    <p>{revenus.toLocaleString('fr-FR')} €</p>
  </div>

 <div className="stat-card">
  <h3>Budget restant</h3>

  <p className={budgetRestant < 0 ? "budget-danger" : "budget-success"}>
    {budgetRestant.toLocaleString("fr-FR")} €
  </p>

  <p className={budgetRestant < 0 ? "budget-danger" : "budget-success"}>
    {budgetRestant < 0 ? "Budget dépassé" : "Budget respecté"}
  </p>

  <div className="budget-form">
    <input
      type="number"
      min="0"
      step="0.01"
      placeholder="Nouveau budget"
      value={nouveauBudget}
      onChange={(event) => setNouveauBudget(event.target.value)}
    />

    <button onClick={modifierBudget}>
      Modifier
    </button>
  </div>
</div>
  </div>

  <div className='charts-grid'>
    <div className='chart-card'>
    <h2>Évolution de ton solde </h2>
    {
    evolutionSolde.length === 0
    ?<p>aucune transaction pour le moment </p>
    : <ResponsiveContainer width="100%" height={190}>

      <LineChart data={evolutionSolde}>
      <CartesianGrid strokeDasharray = "3 3" stroke="#e5e9e1"/>
      <XAxis dataKey="date"
       tickFormatter={(date)=> date.slice(8,10) + "/" + date.slice(5,7)} />
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
    </ResponsiveContainer>}
  </div>
  
    <div className='chart-card'>
      <h2>Répartition des dépenses</h2>
      { depensesRegroupees.length === 0 
      ?<p> aucune dépense pour le moment </p>
      :<ResponsiveContainer width = "100%"  height ={190}>
         
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
    {depensesRegroupees.map((depense, index) => (
      <Cell
        key={depense.categorie}
        fill={COLORS[index % COLORS.length]}
      />
    ))}
  </Pie>
  <Tooltip />
  <Legend
  verticalAlign="bottom"
  align="center"
  iconType="circle"
  formatter={(value) => `${value} - ${(depensesParCategorie[value] || 0).toLocaleString("fr-FR")}€ `}
  />
</PieChart>
        
    
      </ResponsiveContainer>}
      </div>
  </div>

  <div className = "ajout-card">
    <h2>Ajouter une transaction</h2>
    <input type = "text" placeholder = "nom de la transaction" value = {nom} onChange={(event) => setNom(event.target.value)}/>
    <input type = "number" placeholder='montant en  €' value ={montant} min = "0.01" step = "0.01" onChange={(event) =>setMontant(event.target.value)}/>
    <select   value={typeTransaction}
  onChange={(event) => {
    setTypeTransaction(event.target.value);
    setCategorie("");
  }}>
      <option value="depense">depense</option>
      <option value ="revenu">revenu</option>
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
{erreur && <p className="message-erreur">{erreur}</p>}</div>

<div className="transactions-card">
  <h2>Transactions récentes</h2>

  <div className="transactions-filtres">
    <input
      type="text"
      placeholder="Rechercher une transaction..."
      value={recherche}
      onChange={(event) => setRecherche(event.target.value)}
    />

    <select
      value={filtreType}
      onChange={(event) => setFiltreType(event.target.value)}
    >
      <option value="tous">Toutes</option>
      <option value="depense">Dépenses</option>
      <option value="revenu">Revenus</option>
    </select>
  </div>

  {transactionRecentes.length === 0
    ? <p>Aucune transaction trouvée.</p>
    : transactionRecentes.map((transaction) => (
      <div className="transaction-item" key={transaction.id}>

        {transactionEnModification === transaction.id ? (
          <div className="modification-form">

            <input
              type="text"
              placeholder="Nom"
              value={nomModifie}
              onChange={(event) => setNomModifie(event.target.value)}
            />

            <input
              type="number"
              placeholder="Montant"
              min="0.01"
              step="0.01"
              value={montantModifie}
              onChange={(event) => setMontantModifie(event.target.value)}
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
              onChange={(event) => setCategorieModifiee(event.target.value)}
            >
              <option value="">Choisir une catégorie</option>

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
              <p className="message-erreur">{erreurModification}</p>
            )}

            <div className="transaction-actions">
              <button
                className="bouton-enregistrer"
                onClick={() => enregistrerModification(transaction.id)}
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
              <p className="transaction-nom">{transaction.nom}</p>
              <p className="transaction-categorie">{transaction.categorie}</p>
              <p className={transaction.montant < 0 ? "montant-negatif" : "montant-positif"}>
                {transaction.montant.toLocaleString("fr-FR")} €
              </p>

              <p className="transaction-date">
                {transaction.date.slice(8, 10) + "/" +
                  transaction.date.slice(5, 7) + "/" +
                  transaction.date.slice(0, 4)}
              </p>
            </div>

            <div className="transaction-actions">
              <button
                className="bouton-modifier"
                onClick={() => commencerModification(transaction)}
              >
                Modifier
              </button>

              <button
                className="bouton-supprimer"
                onClick={() => supprimerTransaction(transaction.id)}
              >
                Supprimer
              </button>
            </div>
          </>
        )}

      </div>
    ))
  }
</div>
    </>
  )}
  </main>

</div> 
)}

export default App