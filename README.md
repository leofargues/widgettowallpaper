# 📱 Widget to Wallpaper

> **Widget to Wallpaper** est un outil gratuit et open source permettant d'afficher votre calendrier directement sur l'écran verrouillé (*lockscreen*) de votre iPhone, sans aucune application tierce payante.
>
> 📱 **Compatibilité** : Conçu et testé pour **iPhone 17** (résolution 1206 × 2622 px). Non testé sur les autres modèles.
>
> 📖 **Tutoriel interactif pas-à-pas** : Une page de configuration guidée style Notion est incluse directement dans le projet sur **`/setup.html`** (ex. `https://votre-projet.vercel.app/setup.html`).

---

## ✨ Fonctionnalités

- 🧭 **Guide de configuration interactif** : Page `/setup.html` intégrée avec tutoriel pas-à-pas, détection automatique de domaine et boutons de copie en 1 clic.
- 📅 **Synchronisation iCal en direct** : Se synchronise instantanément avec votre flux Google Agenda (ou tout calendrier supportant iCal / `.ics`).
- 🌓 **Thèmes Clair & Sombre** : Basculez automatiquement entre les modes Jour (`theme=light`) et Nuit (`theme=dark`).
- ⚡ **Génération à la volée ultra-rapide** : Rendu graphique instantané propulsé par [Next.js](https://nextjs.org/) et `next/og` (Satori).
- 📲 **100% Natif iOS** : Utilise l'application native **Raccourcis** (*Shortcuts*) d'iOS pour mettre à jour automatiquement votre fond d'écran à des heures clés de la journée.
- 🔒 **Respect total de la vie privée** : Aucune base de données, aucun tracking, aucun serveur tiers. Tout s'exécute sur votre propre instance Vercel gratuite.
- 📐 **Haute Définition Retina** : Conçu sur mesure aux dimensions standard des écrans iPhone (1206 × 2622 px).

---

## 🏗️ Architecture & Fonctionnement

```text
[ Google Agenda (iCal) ]
          │
          ▼
[ API Next.js : /api/wallpaper ] ──(Génération Satori)──► [ Image JPEG/PNG HD ]
          ▲
          │ (Requête planifiée matin & soir)
[ Automatisation Raccourcis iPhone ] ──► [ Fond d'écran Lockscreen mis à jour ]
```

1. **L'iPhone** déclenche une automatisation à heure programmée (ex. 07h00 et 20h00).
2. **L'API Next.js** récupère les événements du jour depuis l'URL secrète de votre calendrier.
3. **Le moteur Satori (`next/og`)** génère une image HD stylisée au format lockscreen.
4. **L'iPhone** télécharge l'image et l'applique immédiatement comme fond d'écran.

---

## 🚀 Guide de déploiement

> 💡 **Astuce** : Une fois déployé sur Vercel, ouvrez simplement **`https://votre-projet.vercel.app/setup.html`** pour suivre l'assistant interactif étape par étape !

### Étape 1 : Obtenir vos accès Google Calendar

Vous avez deux méthodes pour connecter votre calendrier :

#### Méthode 1 : API Google (Recommandée — Couleurs natives & Rapide)
1. Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet et activez l'API **Google Calendar API**.
3. Dans **Écran de consentement OAuth**, choisissez **Externe** (ajoutez votre email comme utilisateur test).
4. Dans **Identifiants**, créez un **ID client OAuth** (Application Web).
   - Ajoutez les URIs de redirection autorisés : `http://localhost:3000/api/auth/google/callback` et `https://votre-projet.vercel.app/api/auth/google/callback`.
5. Notez votre **Client ID** et **Client Secret**.

#### Méthode 2 : Lien iCal (Alternative simple)
1. Sur Google Agenda, allez dans **Paramètres et partage** de votre agenda.
2. Copiez l'**Adresse secrète au format iCal** (se termine par `basic.ics`).

---

### Étape 2 : Déployer sur Vercel (Gratuit)

1. Forkez ou poussez ce dépôt sur votre compte **GitHub**.
2. Allez sur [Vercel](https://vercel.com/) et cliquez sur **Add New > Project**.
3. Importez votre dépôt `Widget-to-Wallpaper`.
4. Dans la section **Environment Variables**, ajoutez selon votre méthode :
   - **Méthode 1 (API Google)** : 
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
   - **Méthode 2 (iCal)** : 
     - `GOOGLE_CALENDAR_ICAL_URL`
5. Cliquez sur **Deploy**.

> 🔗 **Pour la Méthode 1** : Une fois déployé, visitez `https://votre-projet.vercel.app/api/auth/google/login` pour vous connecter et obtenir votre `GOOGLE_REFRESH_TOKEN` à ajouter dans Vercel.
5. Cliquez sur **Deploy**.

Votre instance sera accessible publiquement sur une URL du type :
- **Image de fond d'écran** : `https://votre-projet.vercel.app/api/wallpaper`
- **Page de configuration** : `https://votre-projet.vercel.app/setup.html`

---

### Étape 3 : Configurer les Raccourcis iPhone

Ouvrez l'application **Raccourcis** sur votre iPhone et rendez-vous dans l'onglet **Automatisations**.

#### 🌅 Automatisation du matin (Thème Clair - 07h00)
1. Touchez **+** > **Heure de la journée** > Choisissez `07:00` (Répéter : Tous les jours).
2. Sélectionnez **Exécuter immédiatement** (décochez *Confirmer avant d'exécuter*).
3. Ajoutez les actions suivantes :
   - **Obtenir le contenu de l'URL** : `https://votre-projet.vercel.app/api/wallpaper?theme=light`
   - **Définir la photo comme fond d'écran** : Sélectionnez *Contenu de l'URL* et appliquez à *Écran verrouillé* (Désactivez *Afficher l'aperçu*).

#### 🌙 Automatisation du soir (Thème Sombre - 20h00)
1. Touchez **+** > **Heure de la journée** > Choisissez `20:00` (Répéter : Tous les jours).
2. Sélectionnez **Exécuter immédiatement**.
3. Ajoutez les actions suivantes :
   - **Obtenir le contenu de l'URL** : `https://votre-projet.vercel.app/api/wallpaper?theme=dark`
   - **Définir la photo comme fond d'écran** : Sélectionnez *Contenu de l'URL* et appliquez à *Écran verrouillé*.

---

## 📡 Référence de l'API

### `GET /api/wallpaper`

Génère et retourne l'image du fond d'écran au format image dynamique.

#### Paramètres de requête (Query Params) :

| Paramètre | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `light` | Thème visuel du widget : `light` (clair) ou `dark` (sombre) |
| `variant` | `string` | `default` | Taille d'affichage : `default` (standard - 3 événements) ou `expanded` (grande - 8 événements sur 2 colonnes) |

#### Exemples :
- `https://votre-projet.vercel.app/api/wallpaper` (Thème clair standard)
- `https://votre-projet.vercel.app/api/wallpaper?theme=dark&variant=expanded` (Thème sombre grand format)

---

## 💻 Développement Local

### Prérequis
- Node.js 18+ ou 20+
- npm ou pnpm

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-compte/Widget-to-Wallpaper.git
cd Widget-to-Wallpaper

# Installer les dépendances
npm install

# Créer votre fichier d'environnement local
cp .env.example .env
# Renseignez ensuite votre GOOGLE_CALENDAR_ICAL_URL dans le fichier .env

# Lancer le serveur de développement
npm run dev
```

Ouvrez :
- [http://localhost:3000/setup.html](http://localhost:3000/setup.html) pour accéder au guide interactif de configuration.
- [http://localhost:3000/api/wallpaper](http://localhost:3000/api/wallpaper) pour visualiser le rendu de votre fond d'écran en direct.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router)
- **Génération d'images** : [`next/og`](https://nextjs.org/docs/app/building-your-application/optimizing/open-graph-images) / [Satori](https://github.com/vercel/satori)
- **Hébergement** : [Vercel Serverless Functions](https://vercel.com/)
- **Automatisation Client** : Apple iOS Shortcuts

---

## 📄 Licence

Projet sous licence libre et open source. N'hésitez pas à contribuer ou à adapter le design selon vos envies !
