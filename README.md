# Veat-back
Backend de l'application V'eat avec Node.js, Express et Supabase

## 🚀 Installation

1. Cloner le repository
```bash
git clone <url-du-repo>
cd Veat-back
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Puis éditer le fichier `.env` avec les informations Supabase:
- `SUPABASE_URL`: URL du projet Supabase
- `SUPABASE_ANON_KEY`: Clé anonyme du projet Supabase

## 📦 Configuration Supabase

### Créer la table users dans Supabase

Exécutez cette requête SQL dans l'éditeur SQL de Supabase:

```sql
CREATE TABLE users (
  user_id BIGSERIAL PRIMARY KEY,
  last_name TEXT,
  first_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  isAdmin BOOLEAN DEFAULT false
);

-- Créer un index sur l'email pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
```

## 🔧 Utilisation

### Développement
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📝 API Endpoints

### Users

- `GET /users` - Récupérer tous les utilisateurs
- `GET /users/:id` - Récupérer un utilisateur par ID
- `POST /users` - Créer un nouvel utilisateur
- `PUT /users/:id` - Mettre à jour un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur

### Exemple de création d'utilisateur

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

## 🛠️ Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Langage typé
- **Supabase** - Base de données PostgreSQL et backend-as-a-service
- **@supabase/supabase-js** - Client Supabase

## 📂 Structure du projet

```
Veat-back/
├── src/
│   ├── controllers/     # Logique métier
│   ├── db/             # Configuration Supabase
│   ├── models/         # Interfaces TypeScript
│   ├── routes/         # Routes Express
│   └── server.ts       # Point d'entrée
├── .env.example        # Variables d'environnement exemple
├── package.json
└── tsconfig.json
```

