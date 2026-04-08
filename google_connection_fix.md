# Guide : Rester connecté à Google indéfiniment

Pour que la connexion reste active indéfiniment sur mobile, nous devons gérer le **Refresh Token** de Google. Par défaut, le token d'accès (`provider_token`) expire toutes les heures. Supabase ne le rafraîchit pas automatiquement pour vous.

Voici les 3 étapes pour corriger cela définitivement.

## 1. Mettre à jour la base de données (SQL)

Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase pour permettre le stockage des tokens de rafraîchissement et assurer la persistance multi-appareils.

```sql
-- Ajout des colonnes pour les tokens Google dans user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS blender_folder_id TEXT;
```

## 2. État du projet Google Cloud (TRÈS IMPORTANT)

Si votre application Google Cloud est en mode **"Testing"** (Test), les refresh tokens expirent après **7 jours**. C'est probablement la cause de vos déconnexions hebdomadaires.
1. Allez sur la [Console Google Cloud](https://console.cloud.google.com/).
2. Accédez à **Écran de consentement OAuth**.
3. Cliquez sur le bouton **PUBLIER L'APPLICATION**.
4. Validez. Cela retire la limite des 7 jours.

## 3. Ce que j'ai mis à jour dans votre code

J'ai déjà modifié les fichiers suivants pour améliorer la stabilité :

- **`src/lib/googleCalendar.js`** : La fonction `getGoogleToken()` tente maintenant de récupérer les tokens depuis 3 sources (Session active > LocalStorage > Base de données). Elle sauvegarde aussi le `refresh_token` dès qu'il est disponible.
- **`src/pages/Settings.jsx`** : Le composant capture désormais les tokens immédiatement après la redirection Google et les synchronise avec votre table `user_preferences`.

### Prochaine étape recommandée :
Si malgré ces changements le token expire encore toutes les heures, il faudra déployer une **Supabase Edge Function** pour effectuer le rafraîchissement automatique. Si vous êtes prêt, je peux vous donner le code et la commande à lancer.
