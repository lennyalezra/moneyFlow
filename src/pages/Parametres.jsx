
import { useEffect, useState } from "react";
import "./Parametres.css";

const CLE_PARAMETRES = "moneyflow-parametres";

const PARAMETRES_DEFAUT = {
  nom: "",
  email: "",
  langue: "fr",
  devise: "EUR",
  premierJour: "lundi",
  theme: "clair",
  notifications: true,
};

function lireParametres() {
  try {
    const sauvegarde = localStorage.getItem(CLE_PARAMETRES);

    if (sauvegarde) {
      return {
        ...PARAMETRES_DEFAUT,
        ...JSON.parse(sauvegarde),
      };
    }
  } catch (erreur) {
    console.error("Erreur de chargement des paramètres :", erreur);
  }

  return { ...PARAMETRES_DEFAUT };
}

function Parametres({ setPrenomUtilisateur }) {
  const [parametres, setParametres] = useState(lireParametres);
  const [formulaire, setFormulaire] = useState(lireParametres);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [confirmationSuppression, setConfirmationSuppression] =
    useState(false);

  const nomAffiche = parametres.nom.trim() || "Utilisateur";

  useEffect(() => {
    document.title = "Paramètres | MoneyFlow";
  }, []);

  // Applique le thème à toute l'application.
  useEffect(() => {
    document.documentElement.dataset.theme =
      formulaire.theme === "sombre" ? "sombre" : "clair";
  }, [formulaire.theme]);

  function modifierChamp(champ, valeur) {
    setFormulaire((precedent) => ({
      ...precedent,
      [champ]: valeur,
    }));

    setMessage("");
    setErreur("");
  }

  function enregistrer(event) {
    event.preventDefault();

    const nom = formulaire.nom.trim();
    const email = formulaire.email.trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur("L'adresse e-mail n'est pas valide.");
      setMessage("");
      return;
    }

    const nouveauxParametres = {
      ...formulaire,
      nom,
      email,
    };

    try {
      localStorage.setItem(
        CLE_PARAMETRES,
        JSON.stringify(nouveauxParametres)
      );

      // Synchronise le thème avec App.jsx.
      document.documentElement.dataset.theme =
        nouveauxParametres.theme === "sombre"
          ? "sombre"
          : "clair";

      window.dispatchEvent(
        new Event("moneyflow-theme-change")
      );

      // Met à jour le prénom sur l'accueil.
      localStorage.setItem("moneyflow-nom", nom);

      if (setPrenomUtilisateur) {
        setPrenomUtilisateur(nom);
      }

      setParametres(nouveauxParametres);
      setFormulaire(nouveauxParametres);

      setMessage("Tes préférences ont été enregistrées.");
      setErreur("");
    } catch (error) {
      setErreur("Impossible d'enregistrer les préférences.");
      setMessage("");
    }
  }

  // EXPORTATION DES DONNÉES
  function exporterDonnees() {
    try {
      const donnees = {};

      for (let index = 0; index < localStorage.length; index++) {
        const cle = localStorage.key(index);

        if (
          cle &&
          (cle.toLowerCase().includes("moneyflow") ||
            cle === "transactions" ||
            cle === "categories" ||
            cle === "budgets")
        ) {
          const valeur = localStorage.getItem(cle);

          try {
            donnees[cle] = JSON.parse(valeur);
          } catch {
            donnees[cle] = valeur;
          }
        }
      }

      const contenu = JSON.stringify(
        {
          application: "MoneyFlow",
          exporteLe: new Date().toISOString(),
          donnees,
        },
        null,
        2
      );

      const fichier = new Blob([contenu], {
        type: "application/json",
      });

      const url = URL.createObjectURL(fichier);
      const lien = document.createElement("a");

      lien.href = url;
      lien.download = `moneyflow-sauvegarde-${
        new Date().toISOString().slice(0, 10)
      }.json`;

      document.body.appendChild(lien);
      lien.click();
      lien.remove();

      URL.revokeObjectURL(url);

      setMessage("Ta sauvegarde MoneyFlow a été téléchargée.");
      setErreur("");
    } catch (error) {
      setErreur("L'exportation des données a échoué.");
      setMessage("");
    }
  }

  // SUPPRESSION DES DONNÉES
  function supprimerDonnees() {
    if (!confirmationSuppression) {
      setConfirmationSuppression(true);
      return;
    }

    const confirmation = window.confirm(
      "Attention : cette action supprimera les données MoneyFlow enregistrées dans ce navigateur. Continuer ?"
    );

    if (!confirmation) {
      setConfirmationSuppression(false);
      return;
    }

    const clesASupprimer = [];

    for (let index = 0; index < localStorage.length; index++) {
      const cle = localStorage.key(index);

      if (
        cle &&
        (cle.toLowerCase().includes("moneyflow") ||
          cle === "transactions" ||
          cle === "categories" ||
          cle === "budgets")
      ) {
        clesASupprimer.push(cle);
      }
    }

    clesASupprimer.forEach((cle) => {
      localStorage.removeItem(cle);
    });

    document.documentElement.dataset.theme = "clair";
    setConfirmationSuppression(false);

    window.location.reload();
  }

  return (
    <div
      className={`param-page ${
        formulaire.theme === "sombre" ? "param-sombre" : ""
      }`}
    >
      {/* EN-TÊTE */}

      <header className="param-entete">
        <span className="param-sur-titre">MES FINANCES</span>

        <h1>
          Paramètres <span>◇</span>
        </h1>

        <p>
          Gère ton compte, personnalise ton expérience et
          retrouve tes données.
        </p>
      </header>

      {/* BANNIÈRE PROFIL */}

      <section className="param-banniere">
        <div className="param-avatar">
          <span>♙</span>
        </div>

        <div className="param-banniere-texte">
          <span className="param-banniere-surtitre">
            MON ESPACE PERSONNEL
          </span>

          <h2>Bonjour {nomAffiche} !</h2>

          <p>Bienvenue dans tes paramètres MoneyFlow.</p>
        </div>

        <button
          type="button"
          className="param-banniere-bouton"
          onClick={() =>
            document.getElementById("param-nom")?.focus()
          }
        >
          ✎ Modifier le profil
        </button>

        <span className="param-banniere-deco">✧</span>
      </section>

      {/* FORMULAIRE PRINCIPAL */}

      <form
        id="param-formulaire-principal"
        className="param-grille"
        onSubmit={enregistrer}
      >
        {/* COMPTE */}

        <section className="param-carte">
          <div className="param-carte-entete">
            <div className="param-icone">♙</div>

            <div>
              <h2>Compte</h2>
              <p>Informations de ton profil.</p>
            </div>
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">♙</span>

              <label htmlFor="param-nom">
                Nom d'utilisateur
              </label>
            </div>

            <input
              id="param-nom"
              type="text"
              maxLength={40}
              placeholder="Ton nom"
              value={formulaire.nom}
              onChange={(event) =>
                modifierChamp("nom", event.target.value)
              }
            />
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">✉</span>

              <label htmlFor="param-email">
                Adresse e-mail
              </label>
            </div>

            <input
              id="param-email"
              type="email"
              placeholder="exemple@email.fr"
              value={formulaire.email}
              onChange={(event) =>
                modifierChamp("email", event.target.value)
              }
            />
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">◎</span>

              <label htmlFor="param-langue">Langue</label>
            </div>

            <select
              id="param-langue"
              value={formulaire.langue}
              onChange={(event) =>
                modifierChamp("langue", event.target.value)
              }
            >
              <option value="fr">Français</option>
            </select>
          </div>

          <p className="param-note">
            Le profil est enregistré localement. Il ne s'agit
            pas encore d'un compte connecté.
          </p>
        </section>

        {/* PRÉFÉRENCES */}

        <section className="param-carte">
          <div className="param-carte-entete">
            <div className="param-icone">☷</div>

            <div>
              <h2>Préférences</h2>
              <p>Personnalise ton espace MoneyFlow.</p>
            </div>
          </div>

          {/* APPARENCE */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">☼</span>

              <div>
                <strong>Apparence</strong>
                <small>Thème de toute l'application</small>
              </div>
            </div>

            <div className="param-theme-choix">
              <button
                type="button"
                className={
                  formulaire.theme === "clair" ? "actif" : ""
                }
                onClick={() =>
                  modifierChamp("theme", "clair")
                }
              >
                ☼ Clair
              </button>

              <button
                type="button"
                className={
                  formulaire.theme === "sombre" ? "actif" : ""
                }
                onClick={() =>
                  modifierChamp("theme", "sombre")
                }
              >
                ☾ Sombre
              </button>
            </div>
          </div>

          {/* DEVISE */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">€</span>

              <label htmlFor="param-devise">
                Devise de référence
              </label>
            </div>

            <select
              id="param-devise"
              value={formulaire.devise}
              onChange={(event) =>
                modifierChamp("devise", event.target.value)
              }
            >
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          {/* PREMIER JOUR */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">▦</span>

              <label htmlFor="param-semaine">
                Premier jour de la semaine
              </label>
            </div>

            <select
              id="param-semaine"
              value={formulaire.premierJour}
              onChange={(event) =>
                modifierChamp(
                  "premierJour",
                  event.target.value
                )
              }
            >
              <option value="lundi">Lundi</option>
              <option value="dimanche">Dimanche</option>
            </select>
          </div>

          {/* NOTIFICATIONS */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">♧</span>

              <div>
                <strong>Rappels de budget</strong>

                <small>
                  Préférence pour les futures alertes
                </small>
              </div>
            </div>

            <label className="param-switch">
              <input
                type="checkbox"
                checked={formulaire.notifications}
                onChange={(event) =>
                  modifierChamp(
                    "notifications",
                    event.target.checked
                  )
                }
              />

              <span className="param-switch-visuel" />
            </label>
          </div>

          <p className="param-note">
            Le thème clair ou sombre s'applique à MoneyFlow.
            Les rappels de budget seront disponibles
            prochainement.
          </p>
        </section>

        {/* CONFIDENTIALITÉ */}

        <section className="param-carte">
          <div className="param-carte-entete">
            <div className="param-icone">♢</div>

            <div>
              <h2>Confidentialité</h2>
              <p>Garde le contrôle de tes données.</p>
            </div>
          </div>

          {/* EXPORT */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">▤</span>

              <div>
                <strong>Exporter mes données</strong>

                <small>
                  Télécharger une sauvegarde au format JSON.
                </small>
              </div>
            </div>

            <button
              type="button"
              className="param-btn-secondaire"
              onClick={exporterDonnees}
            >
              ↓ Exporter
            </button>
          </div>

          {/* STOCKAGE */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">⌂</span>

              <div>
                <strong>Stockage local</strong>

                <small>
                  Données enregistrées dans ce navigateur.
                </small>
              </div>
            </div>

            <span className="param-etiquette">
              LocalStorage
            </span>
          </div>

          {/* SUPPRESSION */}

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">×</span>

              <div>
                <strong>Supprimer mes données</strong>

                <small>
                  Effacer les sauvegardes locales MoneyFlow.
                </small>
              </div>
            </div>

            <button
              type="button"
              className="param-btn-danger"
              onClick={supprimerDonnees}
            >
              {confirmationSuppression
                ? "Confirmer"
                : "Supprimer"}
            </button>
          </div>

          {confirmationSuppression && (
            <p className="param-avertissement">
              Attention : cette action est irréversible sans
              sauvegarde. Clique sur « Confirmer » puis valide
              la fenêtre de confirmation, ou annule ci-dessous.

              <button
                type="button"
                onClick={() =>
                  setConfirmationSuppression(false)
                }
              >
                Annuler
              </button>
            </p>
          )}
        </section>

        {/* SÉCURITÉ */}

        <section className="param-carte">
          <div className="param-carte-entete">
            <div className="param-icone">♙</div>

            <div>
              <h2>Sécurité</h2>

              <p>Les protections de ton futur compte.</p>
            </div>
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">⚿</span>

              <div>
                <strong>Mot de passe</strong>

                <small>
                  Modifier le mot de passe du compte.
                </small>
              </div>
            </div>

            <span className="param-etiquette">
              À venir
            </span>
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">♧</span>

              <div>
                <strong>Double authentification</strong>

                <small>
                  Ajouter une protection supplémentaire.
                </small>
              </div>
            </div>

            <span className="param-etiquette">
              À venir
            </span>
          </div>

          <div className="param-ligne">
            <div className="param-ligne-label">
              <span className="param-petit-icone">▣</span>

              <div>
                <strong>Sessions actives</strong>

                <small>
                  Gérer les appareils connectés.
                </small>
              </div>
            </div>

            <span className="param-etiquette">
              À venir
            </span>
          </div>

          <p className="param-note">
            Ces fonctionnalités nécessitent
            l'authentification du futur back-end.
          </p>
        </section>
      </form>

      {/* PIED DE PAGE */}

      <footer className="param-pied">
        <div>
          {message && (
            <p className="param-message" role="status">
              ✓ {message}
            </p>
          )}

          {erreur && (
            <p className="param-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>

        <button
          className="param-btn-enregistrer"
          type="submit"
          form="param-formulaire-principal"
        >
          ✓ Enregistrer les modifications
        </button>
      </footer>
    </div>
  );
}

export default Parametres;
