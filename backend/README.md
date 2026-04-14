# Backend - Airbnb Clone

API RESTful développée avec **Node.js**, **Express** et **MongoDB** pour une application de type Airbnb.

## Prérequis

- Node.js (v18 ou supérieur)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

## Installation

1. **Cloner le repository et accéder au dossier backend**

```bash
cd backend
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du dossier backend :

```bash
cp .env.exemple .env
```

Puis éditez le fichier `.env` avec vos valeurs :

```env
MONGO_URI="mongodb://localhost:27017/airbnb-clone"
PORT=3500
JWT_SECRET="votre_secret_jwt_tres_securise"
```

## Structure du projet

```
backend/
├── app.js                 # Configuration Express (middleware, routes)
├── index.js               # Point d'entrée du serveur
├── config/
│   └── db.js             # Connexion à MongoDB
├── controllers/
│   ├── auth.controller.js    # Logique d'authentification
│   └── hebergment.controller.js # Logique des hébergements
├── middlewares/
│   └── rate-limiter.js   # Limitation de requêtes (500 req/15min)
├── models/
│   ├── user.model.js     # Schéma User (mongoose)
│   └── hebergement.model.js # Schéma Hebergement (mongoose)
├── routes/
│   ├── auth.route.js     # Routes /api/auth
│   ├── hebergement.route.js # Routes /api/hebergement
│   └── user.route.js     # Routes /api/users
├── services/
│   ├── auth.service.js   # Services métier auth (register, login, verifyToken)
│   └── filter.service.js # Services de filtrage et pagination
└── tests/
    └── getHebergemnts.test.js # Tests Jest
```

## Scripts disponibles

| Commande      | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm run dev` | Lance le serveur en mode développement (nodemon) |
| `npm start`   | Lance le serveur en mode production              |
| `npm test`    | Exécute les tests avec Jest                      |

## API Endpoints

### Authentification

| Méthode | Endpoint            | Description                         | Body                        |
| ------- | ------------------- | ----------------------------------- | --------------------------- |
| POST    | `/api/auth/sign-up` | Inscription d'un nouvel utilisateur | `{ name, email, password }` |
| POST    | `/api/auth/sign-in` | Connexion (retourne un token JWT)   | `{ email, password }`       |

### Hébergements

| Méthode | Endpoint                   | Description                        | Query Params                                             |
| ------- | -------------------------- | ---------------------------------- | -------------------------------------------------------- |
| GET     | `/api/hebergement/`        | Récupère la liste des hébergements | `limit`, `page`, `q`, `type`, `region`, `classification` |
| GET     | `/api/hebergement/getById` | Récupère un hébergement par son ID | `id`                                                     |

### Utilisateurs

| Méthode | Endpoint      | Description                                       |
| ------- | ------------- | ------------------------------------------------- |
| GET     | `/api/users/` | Récupère la liste des utilisateurs (ADMIN requis) |

## Modèles de données

### User

```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed, non sélectionné par défaut),
  role: Enum ['USER', 'ADMIN'] (défaut: 'USER'),
  isVerified: Boolean (défaut: false),
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

### Hebergement

```javascript
{
  hash_record: String,
  nom: String,
  type: Enum ['HOTEL', 'CAMPING', 'RESIDENCE', 'AUBERGE', 'VILLAGE'],
  capacite: { chambres: Number, lits: Number },
  classification: Number,
  contact: { telephone: String, email: String, site_web: String },
  equipements: [Mixed],
  localisation: {
    adresse: String,
    code_postal: String,
    commune: String,
    departement: String,
    region: String,
    coordinates: { type: 'Point', coordinates: [Number] }
  },
  metadata: { source: String, date_classement: Date, imported_at: Date }
}
```

## Sécurité

- **JWT** : Tokens d'authentification avec expiration (3h)
- **bcrypt** : Hachage des mots de passe (salt 10)
- **Rate Limiting** : 500 requêtes maximum par 15 minutes
- **CORS** : Activé pour toutes les origines (configurable)

## Tests

Les tests sont écrits avec **Jest** et **Supertest** :

```bash
npm test
```

## Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification par token
- **bcryptjs** - Hachage de mots de passe
- **express-rate-limit** - Limitation de débit
- **Jest** - Framework de tests
- **Supertest** - Tests HTTP

## Exemples de requêtes

### Inscription

```bash
curl -X POST http://localhost:3500/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Connexion

```bash
curl -X POST http://localhost:3500/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Récupérer les hébergements

```bash
curl -X GET "http://localhost:3500/api/hebergement/?limit=10&page=1&type=HOTEL"
```

---
