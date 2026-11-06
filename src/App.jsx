import './App.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';


  const transactionsData = [
     { id : 1,
     nom : "courses",
     categorie : "Alimentation" ,
     montant : -65
    },
  
  {
    id : 2,
    nom : "Salaire",
    categorie : "Revenus",
    montant : 2500
  },

  {
    id : 3, 
    nom : "Loyer",
    categorie : "Logement",
    montant : -900
  }];

  const transactionDepenses = transactionsData.filter ((transaction) => (
    transaction.montant < 0 )
  )

  const depensesData = transactionDepenses.map((transaction)=>(
  {categorie : transaction.categorie, 
   montant : Math.abs(transaction.montant)}
))




const COLORS = ['#455d50', '#8ba58e', '#c8b8a4', '#e8ede4'];

const depenses= Math.abs( transactionDepenses.reduce ((total,transaction) => {
return total + transaction.montant;
}, 0));
const transactionRevenus = transactionsData.filter((transaction)=>
transaction.montant > 0 )
const budget= 1200

const revenus= transactionRevenus.reduce((totale , transaction)=>{
  return totale + transaction.montant
} , 0 );


const soldeActuel = revenus - depenses
const budgetRestant = budget - depenses

const soldeData = [
    {mois:'Jan', solde: 1200},
    {mois:'Fev', solde: 900},
    {mois:'Mar', solde: 2600},
    {mois:'Avr', solde: 400},
    {mois:'Mai', solde: 12000},
    {mois:'Jui', solde: soldeActuel}
];
function App(){
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
    <p>{revenus.toLocaleString('fr-FR')}€</p>
  </div>

  <div className ='stat-card'>
    <h3>Budget restant </h3>
    <p className = { budgetRestant < 0 ? "budget-danger" : "budget-success" }>{budgetRestant.toLocaleString ('fr-FR')}€</p>
    <p className ={budgetRestant < 0 ? "budget-danger" : "budget-success"} >
      { budgetRestant < 0 ? "budget dépassé" : "budget respecté"} </p>
  </div>
  </div>

  <div className='charts-grid'>
    <div className='chart-card'>
    <h2>Évolution de ton solde </h2>
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={soldeData}>
      <CartesianGrid strokeDasharray = "3 3" stroke="#e5e9e1"/>
      <XAxis dataKey="mois" />
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
    data={depensesData}
    dataKey="montant"
    nameKey="categorie"
    cx="50%"
    cy="50%"
    innerRadius={55}
    outerRadius={85}
  >
    {depensesData.map((depense, index) => (
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
    {transactionsData.map((transaction) => (
      <div className = "transaction-item"  key = {transaction.id}> 
      <p> {transaction.nom }</p> 
      <p> {transaction.categorie}</p>
      <p className= {transaction.montant < 0 ? "montant-negatif" : "montant-positif"}> {transaction.montant}€</p>
      </div>
))}
  </div>

  </main>

</div> 
)}

export default App