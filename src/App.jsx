import './App.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
 const soldeData = [
    {mois:'Jan', solde: 1200},
    {mois:'Fev', solde: 900},
    {mois:'Mar', solde: 2600},
    {mois:'Avr', solde: 400},
    {mois:'Mai', solde: 12000},
    {mois:'Jui', solde: 3600}
];

const depensesData =[
  { categorie : 'Logement' , montant : 900},
  { categorie : 'Alimentation', montant : 600},
  { categorie : 'Transport', montant : 300},
  { categorie:  'Loisir', montant : 200},
];

const COLORS = ['#455d50', '#8ba58e', '#c8b8a4', '#e8ede4'];
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
    <p>0,00€</p>
  </div>

  <div className ='stat-card'>
    <h3>Dépenses</h3>
    <p>0,00€</p>
  </div>

  <div className ='stat-card'>
    <h3>Revenus</h3>
    <p>0,00€</p>
  </div>

  <div className ='stat-card'>
    <h3>Budget restant </h3>
    <p>0,00€</p>
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

  </main>

</div> 
)}

export default App