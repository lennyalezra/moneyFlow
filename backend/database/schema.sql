
-- MONEYFLOW : BASE DE DONNEES

-- 1. Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    couleur VARCHAR(20) DEFAULT '#8ba58e',
    icone VARCHAR(50),
    UNIQUE (user_id, nom)
);

-- 3. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    categorie_id INTEGER REFERENCES categories(id)
        ON DELETE SET NULL,
    nom VARCHAR(150) NOT NULL,
    montant NUMERIC(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    categorie_id INTEGER REFERENCES categories(id)
        ON DELETE CASCADE,
    montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
    mois DATE NOT NULL,
    UNIQUE (user_id, categorie_id, mois)
);

-- 5. Objectifs d'epargne
CREATE TABLE IF NOT EXISTS objectifs (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    nom VARCHAR(150) NOT NULL,
    montant_cible NUMERIC(12,2) NOT NULL
        CHECK (montant_cible > 0),
    montant_actuel NUMERIC(12,2) DEFAULT 0
        CHECK (montant_actuel >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
