import './App.css';

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
  </div>
  
    <div className='chart-card'>
      <h2>Répartition des dépenses</h2>
      </div>




  </div>
  </main>

</div> 
)}

export default App