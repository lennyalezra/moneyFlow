import './App.css';
import {useState, useEffect} from "react";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
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


function App(){
const [transactions, setTransactions] = useState(JSON.parse(localStorage.getItem("transactions")) || transactionsData);
  const [nom , setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");

useEffect(() =>{
  localStorage.setItem("transactions", JSON.stringify(transactions))
  
}, [transactions]);




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
    montant: Number(montant),
    date: dateComplete
  }



    const transactionsExiste = transactions.some(
    (transaction)=> transaction.id === nouvelleTransaction.id
  );
    
    if (!nom.trim() || !categorie.trim() || !Number.isFinite(Number(montant)) || Number(montant)===0){
      return
    }
    if (!transactionsExiste){
    setTransactions([...transactions,nouvelleTransaction]);
    setNom("");
    setMontant("");
    setCategorie("");
    const transactionMiseAJour = [...transactions, nouvelleTransaction];
    const resultat = JSON.stringify(transactionMiseAJour);
    }
}

function supprimerTransaction(id) {
  const transactionsFiltrees = transactions.filter(
    (transaction) => transaction.id !== id
  );

  setTransactions(transactionsFiltrees);
}



  const transactionRecentes = transactions.toSorted((a,b) => b.date.localeCompare(a.date))
  
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

  const budget= 1200

  const soldeActuel = revenus - depenses
  const budgetRestant = budget - depenses

  




  const transactionTriees = transactions.toSorted((a,b)=> a.date.localeCompare(b.date))

  let soldeCumule = 0;

  const evolutionSolde = transactionTriees.map((transaction)=>
{soldeCumule = soldeCumule + transaction.montant
return {date:transaction.date, solde: soldeCumule}}
)


return(

<div className='app'>
  <aside className='sidebar'>
    <h2>MoneyFlow</h2>
    <nav className ='nav-links'>
      <a href="#accueil">Accueil</a>
      <a href="#transactions">Transactions</a>
      <a href="#budgets">Budgets</a>
      <a href="#statistiques">Statistiques</a>
      <a href="#categories">Catégories</a>
      <a href="#parametres">Paramètres</a>

    </nav>
  </aside>
  <main className='main-content'>
  <h1> Bonjour !</h1>
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

  <div className ='stat-card'>
    <h3>Budget restant </h3>
    <p className = { budgetRestant < 0 ? "budget-danger" : "budget-success" }>{budgetRestant.toLocaleString ('fr-FR')} €</p>
    <p className ={budgetRestant < 0 ? "budget-danger" : "budget-success"} >
      { budgetRestant < 0 ? "budget dépassé" : "budget respecté"} </p>
  </div>
  </div>

  <div className='charts-grid'>
    <div className='chart-card'>
    <h2>Évolution de ton solde </h2>
    <ResponsiveContainer width="100%" height={220}>
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
    </ResponsiveContainer>
  </div>
  
    <div className='chart-card'>
      <h2>Répartition des dépenses</h2>
      <ResponsiveContainer width = "100%"  height ={220}>
         
  <PieChart>
  <Pie
    data={depensesRegroupees}
    dataKey="montant"
    nameKey="categorie"
    cx="50%"
    cy="50%"
    innerRadius={55}
    outerRadius={85}
  >
    {depensesRegroupees.map((depense, index) => (
      <Cell
        key={depense.categorie}
        fill={COLORS[index]}
      />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
        
    
      </ResponsiveContainer>
      </div>
  </div>

  <div className = "transactions-card">
    <h2>Transactions récentes</h2>
    <input type = "text" placeholder = "nom de la transaction" value = {nom} onChange={(event) => setNom(event.target.value)}/>
    <input type = "number" placeholder='valeur du montant' value ={montant} onChange={(event) =>setMontant(event.target.value)}/>
    <select  value ={categorie} onChange={(event) =>setCategorie(event.target.value)}>
    <option value = ""> Choisir une catégorie</option>
    <option value ="Alimentation">Alimentation</option>
    <option value ="Logement">Logement</option>
    <option value ="Transport">Transport</option>
    <option value ="Loisirs">Loisirs</option>
    <option value ="Shopping">Shopping</option>
    <option value ="Santé">Santé</option>
    <option value ="Abonnement">Abonnement</option>
    <option value ="Revenus">Revenus</option>
    <option value ="Autres">Autres</option>


    </select>
   
    <button onClick={ajouterTransaction}>Ajouter une transaction</button>
    {transactionRecentes.map((transaction) => (
      <div className = "transaction-item"  key = {transaction.id}> 
      <p> {transaction.nom }</p> 
      <p> {transaction.categorie}</p>
      <p className= {transaction.montant < 0 ? "montant-negatif" : "montant-positif"}> {transaction.montant.toLocaleString('fr-FR')} €</p>
      <p className = "transaction-date">{transaction.date.slice(8,10) + "/" + transaction.date.slice(5,7)}</p>
      <button onClick={() => supprimerTransaction(transaction.id)}>Supprimer</button>
      </div>
))}
  </div>

  </main>

</div> 
)}

export default App