# O.S. Blender Course Viewer

Une interface web moderne pour visualiser mes cours et astuces Blender. Ce projet permet de naviguer facilement dans une structure de dossiers contenant des PDFs et des mini-sites HTML.

## 🚀 Fonctionnalités Clés

-   **Optimisé pour Mobile** : Interface adaptative (Responsive) avec menu plein écran et navigation tactile.
-   **Visionneuse PDF Hybride** : Utilise l'iframe native sur desktop et **PDF.js** sur mobile pour une compatibilité maximale et des fonctions de swipe.
-   **Menu Dynamique & Intelligent** : Généré automatiquement, il filtre les cours selon la classe sélectionnée.
-   **Système de Connexion Sécurisé** : Sélection de classe (3D1, 3D2, DA3) avec mots de passe distincts et mode "Professeur" pour accéder aux archives complètes.
-   **Section "3D Tips"** : Une section dédiée pour les astuces, séparée des cours principaux.
-   **Architecture "Static Site"** : Pas de base de données requise, fonctionne avec un simple script Python pour l'indexation.
-   **Design Premium** : Interface sombre, glassmorphism, et animations fluides (slide-in menu toggle).
-   **Menu Rétractable** : Maximisez l'espace de lecture en masquant la barre latérale.

---

## 🛠️ Comment Ajouter du Contenu

### 1. Ajouter des Fichiers
Placez vos fichiers dans les dossiers correspondants :
-   **`Cours/`** : Pour les supports de cours principaux. Organisez-les en sous-dossiers (ex: `Cours/3D1/MonCours.pdf`).
-   **`Tips/`** : Pour les astuces et tutoriels.
    -   *PDF* : Déposez directement le fichier PDF.
    -   *Site Web* : Créez un dossier (ex: `Tips/MonProjetWeb`) et placez-y un fichier `index.html`.

### 2. Mettre à Jour le Menu
Après avoir ajouté ou supprimé des fichiers, le site ne se met pas à jour tout seul. Vous devez régénérer l'index :

> **Double-cliquez sur le fichier `update_menu.bat` à la racine du projet.**

Une fenêtre noire va s'ouvrir brièvement pour scanner les dossiers et mettre à jour le fichier `courses_data.js`. Une fois fermée, rafraîchissez votre page web pour voir les changements.

---

## 📦 Déploiement Automatique (GitHub)
Si ce projet est hébergé sur GitHub, une action automatique (`.github/workflows/deploy.yml`) est configurée.
À chaque fois que vous envoyez (`push`) vos modifications sur la branche `main` :
1.  GitHub lance automatiquement le script de scan.
2.  Le site est mis à jour et déployé sur GitHub Pages.
