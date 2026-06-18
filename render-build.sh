#!/usr/bin/env bash
# Script de build pour Render.com - Frontend React

set -o errexit

echo "📦 Installation des dépendances npm..."
npm install

echo "🏗️ Build de l'application React avec Vite..."
npm run build

echo "✅ Build frontend terminé avec succès!"
