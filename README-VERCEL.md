# Configuration Vercel - QCM Frontend

## Variables d'environnement à configurer sur Vercel

1. Allez dans **Settings > Environment Variables** de votre projet Vercel

2. Ajoutez la variable suivante :

```
VITE_API_URL=https://qcm-pro-back-main-ipg9zr.laravel.cloud/api
```

3. Appliquez pour tous les environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Redéployez l'application

## URL Backend

- Backend API : `https://qcm-pro-back-main-ipg9zr.laravel.cloud`
- API Endpoint : `https://qcm-pro-back-main-ipg9zr.laravel.cloud/api`

## Après le déploiement

Une fois le déploiement réussi, vous obtiendrez une URL Vercel (ex: `https://qcm-pro-front.vercel.app`)

Avec cette URL, vous devrez mettre à jour le backend Laravel Cloud :

### Variables à ajouter dans Laravel Cloud :

```bash
FRONTEND_URL=https://votre-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=votre-app.vercel.app
```

(Remplacez `votre-app.vercel.app` par votre URL Vercel réelle)

## Comptes de test

- **Admin** : `admin@example.com` / `password`
- **Élève** : `eleve@example.com` / `password`
