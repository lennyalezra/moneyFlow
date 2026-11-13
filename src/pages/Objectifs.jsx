
import { useMemo, useState } from "react";
import "./Objectifs.css";

const formatEuro = (valeur) =>
  Number(valeur || 0).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export default function Objectifs({
  objectifs = [],
  setObjectifs,
}) {
  const [filtre, setFiltre] = useState("tous");
  const [tri, setTri] = useState("progression");
  const [modal, setModal] = useState("");
  const [objectifActif, setObjectifActif] = useState(null);

  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState("");
  const [epargne, setEpargne] = useState("");
  const [erreur, setErreur] = useState("");

  // CALCUL DE LA PROGRESSION

  function progression(objectif) {
    const cible = Number(objectif.cible || 0);
    const economise = Number(objectif.economise || 0);

    if (cible <= 0) return 0;

    return Math.min(
      100,
      Math.max(0, (economise / cible) * 100)
    );
  }

  // STATISTIQUES DES OBJECTIFS

  const objectifsRealises = objectifs.filter(
    (objectif) => progression(objectif) >= 100
  );

  const objectifsActifs = objectifs.filter(
    (objectif) => progression(objectif) < 100
  );

  const totalEpargne = objectifs.reduce(
    (total, objectif) =>
      total + Number(objectif.economise || 0),
    0
  );

  const totalObjectifs = objectifs.reduce(
    (total, objectif) =>
      total + Number(objectif.cible || 0),
    0
  );

  const progressionGlobale =
    totalObjectifs > 0
      ? Math.min(
          100,
          (totalEpargne / totalObjectifs) * 100
        )
      : 0;

  // FILTRES ET TRI

  const objectifsAffiches = useMemo(() => {
    let liste = [...objectifs];

    if (filtre === "encours") {
      liste = liste.filter(
        (objectif) => progression(objectif) < 100
      );
    }

    if (filtre === "realises") {
      liste = liste.filter(
        (objectif) => progression(objectif) >= 100
      );
    }

    if (tri === "progression") {
      liste.sort(
        (a, b) => progression(b) - progression(a)
      );
    }

    if (tri === "montant") {
      liste.sort(
        (a, b) =>
          Number(b.cible || 0) - Number(a.cible || 0)
      );
    }

    if (tri === "nom") {
      liste.sort((a, b) =>
        String(a.nom).localeCompare(String(b.nom), "fr")
      );
    }

    return liste;
  }, [objectifs, filtre, tri]);

  // CREATION D'UN OBJECTIF

  function creerObjectif(event) {
    event.preventDefault();
    setErreur("");

    const cible = Number(montant);

    if (!nom.trim()) {
      setErreur("Saisis un nom pour ton objectif.");
      return;
    }

    if (!Number.isFinite(cible) || cible <= 0) {
      setErreur(
        "Le montant doit être supérieur à zéro."
      );
      return;
    }

    const nouvelObjectif = {
      id:
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      nom: nom.trim(),
      cible: cible,
      economise: 0,
      date: date || "",
    };

    setObjectifs((anciens) => [
      ...anciens,
      nouvelObjectif,
    ]);

    setNom("");
    setMontant("");
    setDate("");
    setErreur("");
    setModal("");
  }

  // AJOUTER DE L'EPARGNE

  function ajouterEpargne(event) {
    event.preventDefault();
    setErreur("");

    const somme = Number(epargne);

    if (
      !objectifActif ||
      !Number.isFinite(somme) ||
      somme <= 0
    ) {
      setErreur("Saisis un montant positif.");
      return;
    }

    const reste =
      Number(objectifActif.cible) -
      Number(objectifActif.economise || 0);

    if (somme > reste) {
      setErreur(
        `Tu peux encore ajouter au maximum ${formatEuro(reste)}.`
      );
      return;
    }

    setObjectifs((anciens) =>
      anciens.map((objectif) => {
        if (objectif.id !== objectifActif.id) {
          return objectif;
        }

        return {
          ...objectif,
          economise:
            Number(objectif.economise || 0) + somme,
        };
      })
    );

    setEpargne("");
    setObjectifActif(null);
    setErreur("");
    setModal("");
  }

  // SUPPRIMER UN OBJECTIF

  function supprimerObjectif(id) {
    const confirmation = window.confirm(
      "Veux-tu vraiment supprimer cet objectif ?"
    );

    if (!confirmation) return;

    setObjectifs((anciens) =>
      anciens.filter(
        (objectif) => objectif.id !== id
      )
    );
  }

  // OUVRIR ET FERMER LES MODALES

  function ouvrirCreation() {
    setNom("");
    setMontant("");
    setDate("");
    setErreur("");
    setModal("creation");
  }

  function ouvrirEpargne(objectif) {
    setObjectifActif(objectif);
    setEpargne("");
    setErreur("");
    setModal("epargne");
  }

  function fermerModal() {
    setModal("");
    setObjectifActif(null);
    setErreur("");
  }

  // AFFICHAGE DE LA PAGE

  return (
    <div className="obj-page">

      {/* EN-TETE */}

      <header className="obj-header">
        <div>
          <span className="obj-eyebrow">
            MES OBJECTIFS
          </span>

          <h1>
            Mes objectifs d'épargne 🎯
          </h1>

          <p>
            Définis tes projets, suis ta progression
            et avance à ton rythme.
          </p>
        </div>

        <button
          type="button"
          className="obj-btn-primary"
          onClick={ouvrirCreation}
        >
          + Ajouter un objectif
        </button>
      </header>

      {/* CARTES STATISTIQUES */}

      <section className="obj-stats">

        <article className="obj-stat">
          <span className="obj-stat-icon">
            ◎
          </span>

          <div>
            <h3>Objectifs actifs</h3>

            <strong>
              {objectifsActifs.length}
            </strong>

            <p>Projets en cours</p>
          </div>
        </article>

        <article className="obj-stat">
          <span className="obj-stat-icon">
            ◉
          </span>

          <div>
            <h3>Épargne totale</h3>

            <strong>
              {formatEuro(totalEpargne)}
            </strong>

            <p>
              Sur {formatEuro(totalObjectifs)}
            </p>
          </div>
        </article>

        <article className="obj-stat">
          <span className="obj-stat-icon">
            ↗
          </span>

          <div>
            <h3>Progression globale</h3>

            <strong>
              {progressionGlobale.toFixed(1)} %
            </strong>

            <p>De tes objectifs atteints</p>
          </div>
        </article>

        <article className="obj-stat">
          <span className="obj-stat-icon">
            🏆
          </span>

          <div>
            <h3>Objectifs réalisés</h3>

            <strong>
              {objectifsRealises.length}
            </strong>

            <p>Bravo, continue !</p>
          </div>
        </article>

      </section>

      {/* FILTRES ET TRI */}

      <section className="obj-toolbar">

        <div className="obj-filtres">

          <button
            type="button"
            className={
              filtre === "tous" ? "active" : ""
            }
            onClick={() => setFiltre("tous")}
          >
            Tous ({objectifs.length})
          </button>

          <button
            type="button"
            className={
              filtre === "encours" ? "active" : ""
            }
            onClick={() => setFiltre("encours")}
          >
            En cours ({objectifsActifs.length})
          </button>

          <button
            type="button"
            className={
              filtre === "realises" ? "active" : ""
            }
            onClick={() => setFiltre("realises")}
          >
            Réalisés ({objectifsRealises.length})
          </button>

        </div>

        <label className="obj-tri">
          Trier par :

          <select
            value={tri}
            onChange={(event) =>
              setTri(event.target.value)
            }
          >
            <option value="progression">
              Progression
            </option>

            <option value="montant">
              Montant
            </option>

            <option value="nom">
              Nom
            </option>
          </select>
        </label>

      </section>

      {/* CARTES DES OBJECTIFS */}

      <section className="obj-grid">

        {objectifsAffiches.map(
          (objectif, index) => {
            const pourcentage =
              progression(objectif);

            const realise =
              pourcentage >= 100;

            return (
              <article
                key={objectif.id}
                className={`obj-goal ${
                  index % 3 === 1
                    ? "lavande"
                    : ""
                }`}
              >

                <div className="obj-goal-header">

                  <div className="obj-goal-icon">
                    🎯
                  </div>

                  <div className="obj-goal-title">
                    <h2>{objectif.nom}</h2>

                    <p>
                      {realise
                        ? "Objectif atteint !"
                        : "Ton projet avance pas à pas"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="obj-delete"
                    title="Supprimer"
                    aria-label={`Supprimer ${objectif.nom}`}
                    onClick={() =>
                      supprimerObjectif(
                        objectif.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="obj-goal-amount">

                  <span>
                    <strong>
                      {formatEuro(
                        objectif.economise
                      )}
                    </strong>

                    {" / "}

                    {formatEuro(
                      objectif.cible
                    )}
                  </span>

                  <span className="obj-percent">
                    {Math.round(
                      pourcentage
                    )} %
                  </span>

                </div>

                <div className="obj-progress">
                  <div
                    style={{
                      width: `${pourcentage}%`,
                    }}
                  />
                </div>

                <div className="obj-goal-footer">

                  <span>
                    {objectif.date
                      ? `📅 Échéance : ${new Date(
                          `${objectif.date}T12:00:00`
                        ).toLocaleDateString(
                          "fr-FR"
                        )}`
                      : "📅 Sans échéance"}
                  </span>

                  <button
                    type="button"
                    disabled={realise}
                    onClick={() =>
                      ouvrirEpargne(
                        objectif
                      )
                    }
                  >
                    {realise
                      ? "Terminé ✓"
                      : "+ Épargner"}
                  </button>

                </div>

              </article>
            );
          }
        )}

        {/* CARTE AJOUTER */}

        {filtre === "tous" && (
          <button
            type="button"
            className="obj-add-card"
            onClick={ouvrirCreation}
          >
            <span>+</span>

            <strong>
              Ajouter un objectif
            </strong>

            <p>
              Un voyage, un achat important,
              un projet personnel...
            </p>
          </button>
        )}

      </section>

      {/* MESSAGE SI AUCUN RESULTAT */}

      {objectifsAffiches.length === 0 &&
        filtre !== "tous" && (
          <p className="obj-empty">
            Aucun objectif dans cette
            catégorie pour le moment.
          </p>
        )}

      {/* INFORMATION SUR L'EPARGNE */}

      <p
        style={{
          marginTop: "24px",
          color: "#899789",
          fontSize: "12px",
        }}
      >
        Les montants économisés sont suivis
        séparément de tes transactions.
        Ils ne sont pas automatiquement
        déduits de ton solde bancaire.
      </p>

      {/* MODALES */}

      {modal && (
        <div
          className="obj-modal-overlay"
          onClick={fermerModal}
        >

          <div
            className="obj-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="obj-modal-close"
              onClick={fermerModal}
              aria-label="Fermer"
            >
              ×
            </button>

            {modal === "creation" ? (
              <>
                <h2>
                  Créer un objectif 🎯
                </h2>

                <p>
                  Donne vie à ton prochain projet.
                </p>

                <form
                  onSubmit={creerObjectif}
                >

                  <label>
                    Nom de l'objectif
                  </label>

                  <input
                    type="text"
                    value={nom}
                    onChange={(event) =>
                      setNom(
                        event.target.value
                      )
                    }
                    placeholder="Ex : Voyage au Japon"
                    maxLength={50}
                    required
                  />

                  <label>
                    Montant à atteindre (€)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montant}
                    onChange={(event) =>
                      setMontant(
                        event.target.value
                      )
                    }
                    placeholder="Ex : 2000"
                    required
                  />

                  <label>
                    Date souhaitée (facultatif)
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(
                        event.target.value
                      )
                    }
                  />

                  {erreur && (
                    <p className="mf-erreur">
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="obj-btn-primary"
                  >
                    Créer mon objectif
                  </button>

                </form>
              </>
            ) : (
              <>
                <h2>
                  Ajouter de l'épargne 💚
                </h2>

                <p>
                  {objectifActif?.nom}
                </p>

                <form
                  onSubmit={ajouterEpargne}
                >

                  <label>
                    Montant à ajouter (€)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={epargne}
                    onChange={(event) =>
                      setEpargne(
                        event.target.value
                      )
                    }
                    placeholder="Ex : 100"
                    required
                  />

                  {erreur && (
                    <p className="mf-erreur">
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="obj-btn-primary"
                  >
                    Confirmer
                  </button>

                </form>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
