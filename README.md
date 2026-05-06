# Back de l'application Veat

Veat est une application de commande de plats au restaurant, pensée pour réduire l’attente grâce à la préparation en amont.

## Fonctionnalités

### Côté client

- Authentification et gestion du profil (allergies, paramètres, etc.)
- Commande (création, suivi, historique)
- Favoris

### Côté restaurateur

- Gestion des restaurants et du menu (plats)
- Gestion des commandes (statuts, annulation, etc.)

## Démarrer le projet

1. Créer le fichier `.env` à partir de `.env.example`
2. Installer les dépendances
3. Lancer le serveur de dev

```bash
cp .env.example .env
npm install
npm run dev
```
