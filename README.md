# Geometry

Site pédagogique interactif réalisé avec Next.js. L’espace `/admin` présente les visiteurs et pages vues aujourd’hui, les pages vues du mois, les sessions actives dans les cinq dernières minutes, ainsi que les pages consultées et les interactions avec les simulations sur les 30 derniers jours.

## Démarrage local

1. Créez un projet Supabase et copiez `.env.example` vers `.env.local`.
2. Renseignez l’URL du projet et sa clé publique `anon` dans `.env.local`.
3. Exécutez [`supabase/schema.sql`](./supabase/schema.sql) dans le SQL Editor de Supabase.
4. Dans Supabase Authentication, créez un utilisateur administrateur avec son adresse e-mail et un mot de passe fort.
5. Dans le SQL Editor, autorisez cet utilisateur à consulter le tableau de bord :

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID_DE_L_UTILISATEUR_AUTH');
   ```

   Remplacez la valeur par l’UUID de l’utilisateur créé dans Authentication → Users.
6. Installez les dépendances et démarrez le site :

   ```sh
   npm install
   npm run dev
   ```

Le site est accessible à `http://localhost:3000` et l’administration à `/admin`. Il n’y a pas de formulaire d’inscription public ; seuls les comptes ajoutés à `admin_users` peuvent consulter les données et réinitialiser les statistiques.

## Déploiement sur Vercel

Configurez `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` parmi les variables d’environnement du projet Vercel, puis déployez. `NEXT_PUBLIC_SITE_URL` doit être l’URL publique du site. Ne publiez jamais de clé `service_role`.

## Données collectées

Le navigateur envoie les pages consultées et les interactions avec les contrôles des simulations. Un UUID aléatoire temporaire conservé dans `sessionStorage` regroupe les événements dans un onglet et est supprimé à sa fermeture. Les « visiteurs uniques » désignent donc des sessions par onglet, pas des personnes identifiées. Les événements ne contiennent ni adresse IP, ni identifiant de compte, ni valeur des contrôles.

Les événements sont soumis à la validation de l’API et aux politiques RLS de Supabase. L’accès au tableau de bord est contrôlé côté serveur et par la table `admin_users`.

Le bouton « Tout effacer » de l’administration supprime définitivement tous les événements de visites et d’interactions après confirmation. Si le schéma avait déjà été installé, réexécutez [`supabase/schema.sql`](./supabase/schema.sql) pour ajouter la fonction sécurisée nécessaire à cette action.
