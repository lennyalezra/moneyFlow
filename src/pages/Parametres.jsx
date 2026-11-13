
import { useEffect, useState } from "react";
import "./Parametres.css";

const ONGLETS = [
  { id: "compte", titre: "Compte" },
  { id: "apparence", titre: "Apparence" },
  { id: "notifications", titre: "Notifications" },
  { id: "preferences", titre: "Préférences" },
  { id: "donnees", titre: "Données" },
  { id: "securite", titre: "Sécurité" },
];

function lirePreference(cle, valeurDefaut) {
  try {
    return localStorage.getItem(cle) ?? valeurDefaut;
  } catch {
    return valeurDefaut;
  }
}

function lireNotification(cle, valeurDefaut) {
  const valeur = lirePreference(cle, null);
  return valeur === null ? valeurDefaut : valeur === "true";
}

function echapperCSV(valeur) {
  return `"${String(valeur ?? "").replace(/"/g, '""')}"`;
}

function lireCSV(contenu) {
  const lignes = [];
  let ligne = [];
  let cellule = "";
  let entreGuillemets = false;

  for (let i = 0; i < contenu.length; i++) {
    const caractere = contenu[i];

    if (caractere === '"') {
      if (entreGuillemets && contenu[i + 1] === '"') {
        cellule += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (caractere === ";" && !entreGuillemets) {
      ligne.push(cellule);
      cellule = "";
    } else if (
      (caractere === "\n" || caractere === "\r") &&
      !entreGuillemets
    ) {
      if (
        caractere === "\r" &&
        contenu[i + 1] === "\n"
      ) {
        i++;
      }

      ligne.push(cellule);

      if (ligne.some((valeur) => valeur.trim() !== "")) {
        lignes.push(ligne);
      }

      ligne = [];
      cellule = "";
    } else {
      cellule += caractere;
    }
  }

  if (entreGuillemets) {
    throw new Error("Le fichier CSV contient des guillemets incorrects.");
  }

  ligne.push(cellule);

  if (ligne.some((valeur) => valeur.trim() !== "")) {
    lignes.push(ligne);
  }

  return lignes;
}

function dateValide(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [annee, mois, jour] = date.split("-").map(Number);
  const resultat = new Date(Date.UTC(annee, mois - 1, jour));

  return (
    resultat.getUTCFullYear() === annee &&
    resultat.getUTCMonth() === mois - 1 &&
    resultat.getUTCDate() === jour
  );
}

function Parametres({
  transactions = [],
  setTransactions,
  setPrenomUtilisateur,
}) {
  const [ongletActif, setOngletActif] = useState("compte");

  const [nom, setNom] = useState(() =>
    lirePreference("moneyflow-nom", "")
  );

  const [theme, setTheme] = useState(() =>
    lirePreference("moneyflow-theme", "clair")
  );

  const [devise, setDevise] = useState(() =>
    lirePreference("moneyflow-devise", "EUR")
  );

  const [formatDate, setFormatDate] = useState(() =>
    lirePreference("moneyflow-format-date", "fr")
  );

  const [alertesBudget, setAlertesBudget] = useState(() =>
    lireNotification("moneyflow-alertes-budget", true)
  );

  const [resumeHebdo, setResumeHebdo] = useState(() =>
    lireNotification("moneyflow-resume-hebdo", false)
  );

  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fichierImport, setFichierImport] = useState(null);

  const initiale = nom.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("moneyflow-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("moneyflow-devise", devise);
  }, [devise]);

  useEffect(() => {
    localStorage.setItem("moneyflow-format-date", formatDate);
  }, [formatDate]);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-alertes-budget",
      String(alertesBudget)
    );
  }, [alertesBudget]);

  useEffect(() => {
    localStorage.setItem(
      "moneyflow-resume-hebdo",
      String(resumeHebdo)
    );
  }, [resumeHebdo]);

  function changerOnglet(id) {
    setOngletActif(id);
    setMessage("");
  }

  function enregistrerNom(event) {
    event.preventDefault();

    const nouveauNom = nom.trim();

    if (!nouveauNom) {
      setMessage("Veuillez saisir un nom.");
      return;
    }

    localStorage.setItem("moneyflow-nom", nouveauNom);
    setPrenomUtilisateur?.(nouveauNom);
    setNom(nouveauNom);
    setMessage("Profil enregistré avec succès.");
  }

  function exporterCSV() {
    if (transactions.length === 0) {
      setMessage("Aucune transaction à exporter.");
      return;
    }

    const lignes = [
      ["Nom", "Catégorie", "Type", "Montant", "Date"],
      ...transactions.map((transaction) => [
        transaction.nom,
        transaction.categorie,
        Number(transaction.montant) < 0
          ? "Dépense"
          : "Revenu",
        transaction.montant,
        transaction.date,
      ]),
    ];

    const contenu = lignes
      .map((ligne) => ligne.map(echapperCSV).join(";"))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + contenu],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");

    lien.href = url;
    lien.download = "moneyflow-transactions.csv";

    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setMessage("Export CSV préparé.");
  }

  async function importerCSV() {
    if (!fichierImport) {
      setMessage("Sélectionne d'abord un fichier CSV.");
      return;
    }

    if (
      !fichierImport.name.toLowerCase().endsWith(".csv") ||
      fichierImport.size > 2 * 1024 * 1024
    ) {
      setMessage("Choisis un fichier CSV de moins de 2 Mo.");
      return;
    }

    try {
      const contenu = (await fichierImport.text()).replace(
        /^\uFEFF/,
        ""
      );

      const lignes = lireCSV(contenu);

      if (lignes.length < 2) {
        throw new Error(
          "Le fichier ne contient aucune transaction."
        );
      }

      const entetes = lignes[0];

      if (
        entetes.length !== 5 ||
        entetes.join(";") !==
          "Nom;Catégorie;Type;Montant;Date"
      ) {
        throw new Error(
          "Le fichier doit respecter le format CSV de MoneyFlow."
        );
      }

      const nouvellesTransactions = lignes
        .slice(1)
        .map((cellules, index) => {
          if (cellules.length !== 5) {
            throw new Error(
              `Nombre de colonnes incorrect à la ligne ${index + 2}.`
            );
          }

          const [
            nomCSV,
            categorieCSV,
            typeCSV,
            montantTexte,
            dateCSV,
          ] = cellules;

          const montant = Number(montantTexte);

          const montantCorrect =
            Number.isFinite(montant) &&
            montant !== 0 &&
            (
              (typeCSV === "Dépense" && montant < 0) ||
              (typeCSV === "Revenu" && montant > 0)
            );

          if (
            !nomCSV.trim() ||
            !categorieCSV.trim() ||
            !montantCorrect ||
            !dateValide(dateCSV)
          ) {
            throw new Error(
              `Transaction invalide à la ligne ${index + 2}.`
            );
          }

          return {
            id:
              typeof crypto !== "undefined" &&
              crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${index}-${Math.random()}`,
            nom: nomCSV.trim(),
            categorie: categorieCSV.trim(),
            montant,
            date: dateCSV,
          };
        });

      const accord = window.confirm(
        `Importer ${nouvellesTransactions.length} transaction(s) ? Elles seront ajoutées aux transactions existantes.`
      );

      if (!accord) return;

      setTransactions((anciennes) => [
        ...anciennes,
        ...nouvellesTransactions,
      ]);

      setFichierImport(null);

      setMessage(
        `${nouvellesTransactions.length} transaction(s) importée(s).`
      );
    } catch (erreur) {
      setMessage(
        erreur.message || "Impossible d'importer ce fichier."
      );
    }
  }

  function reinitialiserTransactions() {
    if (confirmation !== "REINITIALISER") {
      return;
    }

    const accord = window.confirm(
      "Supprimer définitivement toutes tes transactions ?"
    );

    if (!accord) return;

    setTransactions([]);
    setConfirmation("");
    setMessage("Toutes les transactions ont été supprimées.");
  }

  return (
    <section className="parametres-page">
      <header className="parametres-header">
        <h1>Paramètres</h1>
        <p>
          Gère ton compte, tes préférences et tes données.
        </p>
      </header>

      <nav
        className="parametres-onglets"
        aria-label="Onglets des paramètres"
      >
        {ONGLETS.map((onglet) => (
          <button
            key={onglet.id}
            type="button"
            className={
              ongletActif === onglet.id
                ? "parametres-onglet actif"
                : "parametres-onglet"
            }
            onClick={() => changerOnglet(onglet.id)}
            aria-pressed={ongletActif === onglet.id}
          >
            {onglet.titre}
          </button>
        ))}
      </nav>

      <div className="parametres-contenu">
        {/* COMPTE */}

        {ongletActif === "compte" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                👤
              </span>

              <div>
                <h2>Mon compte</h2>
                <p>Personnalise ton espace MoneyFlow.</p>
              </div>
            </div>

            <div className="parametres-profil">
              <div className="parametres-avatar">
                {initiale}
              </div>

              <div>
                <h3>{nom.trim() || "Utilisateur"}</h3>
                <p>Mon espace personnel</p>
              </div>
            </div>

            <form
              className="parametres-formulaire"
              onSubmit={enregistrerNom}
            >
              <label htmlFor="nom-utilisateur">
                Nom d'utilisateur
              </label>

              <input
                id="nom-utilisateur"
                type="text"
                value={nom}
                maxLength={40}
                placeholder="Ton prénom ou ton pseudo"
                onChange={(event) =>
                  setNom(event.target.value)
                }
                required
              />

              <button
                className="parametres-bouton"
                type="submit"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>
        )}

        {/* APPARENCE */}

        {ongletActif === "apparence" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                ◐
              </span>

              <div>
                <h2>Apparence</h2>
                <p>Choisis le thème de ton application.</p>
              </div>
            </div>

            <div className="parametres-themes">
              {[
                {
                  id: "clair",
                  titre: "Mode clair",
                  symbole: "☀",
                  description: "Sauge et crème",
                },
                {
                  id: "sombre",
                  titre: "Mode sombre",
                  symbole: "☾",
                  description: "Interface sombre",
                },
                {
                  id: "systeme",
                  titre: "Automatique",
                  symbole: "◐",
                  description: "Selon ton appareil",
                },
              ].map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={
                    theme === option.id
                      ? "parametres-theme actif"
                      : "parametres-theme"
                  }
                  onClick={() => setTheme(option.id)}
                  aria-pressed={theme === option.id}
                >
                  <span className="parametres-theme-symbole">
                    {option.symbole}
                  </span>

                  <strong>{option.titre}</strong>
                  <small>{option.description}</small>

                  <span>
                    {theme === option.id
                      ? "✓ Sélectionné"
                      : "Choisir"}
                  </span>
                </button>
              ))}
            </div>

            <div className="parametres-info">
              <strong>Préférence sauvegardée</strong>
              <p>
                Le thème choisi est enregistré dans ton
                navigateur. Son affichage dépend des styles
                prévus dans ton CSS.
              </p>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}

        {ongletActif === "notifications" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                🔔
              </span>

              <div>
                <h2>Notifications</h2>
                <p>
                  Choisis les informations que tu souhaites
                  recevoir.
                </p>
              </div>
            </div>

            <div className="parametres-option">
              <div>
                <h3>Alertes de budget</h3>
                <p>
                  Préférence pour recevoir des alertes
                  lorsque tes dépenses approchent du budget.
                </p>
              </div>

              <label className="parametres-switch">
                <input
                  type="checkbox"
                  checked={alertesBudget}
                  onChange={(event) =>
                    setAlertesBudget(event.target.checked)
                  }
                  aria-label="Activer les alertes de budget"
                />

                <span className="parametres-switch-slider" />
              </label>
            </div>

            <div className="parametres-option">
              <div>
                <h3>Résumé hebdomadaire</h3>
                <p>
                  Préférence pour un récapitulatif de tes
                  revenus et dépenses chaque semaine.
                </p>
              </div>

              <label className="parametres-switch">
                <input
                  type="checkbox"
                  checked={resumeHebdo}
                  onChange={(event) =>
                    setResumeHebdo(event.target.checked)
                  }
                  aria-label="Activer le résumé hebdomadaire"
                />

                <span className="parametres-switch-slider" />
              </label>
            </div>

            <div className="parametres-info">
              <strong>Fonctionnalité en préparation</strong>
              <p>
                Ces préférences sont sauvegardées, mais les
                notifications automatiques ne sont pas encore
                programmées.
              </p>
            </div>
          </div>
        )}

        {/* PRÉFÉRENCES */}

        {ongletActif === "preferences" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                ⚙
              </span>

              <div>
                <h2>Préférences</h2>
                <p>
                  Personnalise l'affichage de tes finances.
                </p>
              </div>
            </div>

            <div className="parametres-preference">
              <label htmlFor="devise">
                Devise préférée
              </label>

              <select
                id="devise"
                value={devise}
                onChange={(event) =>
                  setDevise(event.target.value)
                }
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">
                  Dollar américain ($)
                </option>
                <option value="GBP">
                  Livre sterling (£)
                </option>
              </select>
            </div>

            <div className="parametres-preference">
              <label htmlFor="format-date">
                Format de date
              </label>

              <select
                id="format-date"
                value={formatDate}
                onChange={(event) =>
                  setFormatDate(event.target.value)
                }
              >
                <option value="fr">
                  JJ/MM/AAAA
                </option>
                <option value="us">
                  MM/JJ/AAAA
                </option>
                <option value="iso">
                  AAAA-MM-JJ
                </option>
              </select>
            </div>

            <div className="parametres-info">
              <strong>Préférences enregistrées</strong>
              <p>
                Ces réglages sont sauvegardés. Pour le
                moment, les autres pages affichent les
                montants en euros et les dates dans leur
                format actuel. Changer la devise ne
                convertit pas les montants.
              </p>
            </div>
          </div>
        )}

        {/* DONNÉES */}

        {ongletActif === "donnees" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                ▤
              </span>

              <div>
                <h2>Mes données</h2>
                <p>
                  Sauvegarde et gère tes transactions.
                </p>
              </div>
            </div>

            <div className="parametres-donnee-ligne">
              <div>
                <h3>Exporter mes transactions</h3>
                <p>
                  Télécharge tes transactions au format CSV.
                </p>
                <small>
                  {transactions.length} transaction(s)
                </small>
              </div>

              <button
                className="parametres-bouton"
                type="button"
                onClick={exporterCSV}
              >
                Exporter CSV
              </button>
            </div>

            <div className="parametres-separation" />

            <div className="parametres-donnee-ligne">
              <div>
                <h3>Importer des transactions</h3>
                <p>
                  Récupère les transactions depuis un CSV
                  exporté par MoneyFlow.
                </p>
              </div>
            </div>

            <div className="parametres-import">
              <input
                type="file"
                accept=".csv,text/csv"
                aria-label="Choisir un fichier CSV"
                onChange={(event) =>
                  setFichierImport(
                    event.target.files?.[0] || null
                  )
                }
              />

              <button
                type="button"
                className="parametres-bouton"
                onClick={importerCSV}
                disabled={!fichierImport}
              >
                Importer CSV
              </button>
            </div>

            <div className="parametres-separation" />

            <div className="parametres-donnee-ligne">
              <div>
                <h3>Réinitialiser mes transactions</h3>
                <p>
                  Supprime toutes les transactions enregistrées.
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="parametres-danger">
              <label htmlFor="confirmation-suppression">
                Tape REINITIALISER pour confirmer
              </label>

              <input
                id="confirmation-suppression"
                type="text"
                placeholder="REINITIALISER"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(event.target.value)
                }
              />

              <button
                type="button"
                className="parametres-bouton-danger"
                disabled={
                  confirmation !== "REINITIALISER"
                }
                onClick={reinitialiserTransactions}
              >
                Supprimer toutes mes transactions
              </button>
            </div>
          </div>
        )}

        {/* SÉCURITÉ */}

        {ongletActif === "securite" && (
          <div className="parametres-carte">
            <div className="parametres-carte-titre">
              <span className="parametres-icone">
                ♢
              </span>

              <div>
                <h2>Sécurité et confidentialité</h2>
                <p>
                  Comprends comment tes données sont conservées.
                </p>
              </div>
            </div>

            <div className="parametres-securite-ligne">
              <span className="parametres-indicateur" />

              <div>
                <h3>Stockage local</h3>
                <p>
                  Tes transactions sont actuellement
                  enregistrées dans le localStorage de
                  ton navigateur.
                </p>
              </div>
            </div>

            <div className="parametres-securite-ligne">
              <span className="parametres-indicateur" />

              <div>
                <h3>Connexion utilisateur</h3>
                <p>
                  L'inscription et la connexion seront
                  ajoutées lors du développement du backend.
                </p>
              </div>
            </div>

            <div className="parametres-info">
              <strong>Important</strong>
              <p>
                Le stockage local n'est pas un coffre-fort.
                N'enregistre pas de mots de passe ou de
                données bancaires sensibles dans cette version.
              </p>
            </div>
          </div>
        )}

        {message && (
          <p
            className="parametres-message"
            role="status"
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

export default Parametres;
