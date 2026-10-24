# 🥚 Tamagochi

Un animal virtuel en pixel art pour téléphone, façon Tamagotchi des années 90.
C'est une web-app installable (PWA) : elle s'ouvre dans le navigateur, s'ajoute à l'écran d'accueil et fonctionne hors-ligne.

## Le jeu

- **Le temps passe en vrai**, même quand l'appli est fermée : ton animal a faim, s'ennuie, se salit…
- **Évolution** : Œuf (1 min) → Bébé → Enfant (après 1 jour) → Adulte (après 3 jours).
- **Actions**
  - 🍙 **Nourrir** : repas (remplit la faim) ou friandise (rend joyeux, mais fait grossir)
  - 🎾 **Jouer** : mini-jeu « gauche ou droite ? » en 5 manches
  - 🛁 **Laver** : nettoie les crottes
  - 💊 **Soigner** : guérit quand une tête de mort apparaît
  - 💡 **Dormir / Réveiller** : la nuit, il récupère de l'énergie et a moins faim
- Un **!** clignote quand il a besoin de toi. Négligé trop longtemps, il finit en fantôme 👻.

## Jouer sur ton téléphone

1. Héberge le dossier (par exemple avec **GitHub Pages** : *Settings → Pages → Deploy from branch → `main` / root*).
2. Ouvre l'adresse sur ton téléphone.
3. **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil*.
   **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

## Lancer en local

```bash
python -m http.server 8765
```

Puis ouvre <http://localhost:8765>.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de l'appli |
| `style.css` | Coque, écran LCD, boutons |
| `game.js` | Logique, sprites pixel art, sauvegarde |
| `sw.js` | Cache hors-ligne |
| `manifest.webmanifest` | Installation sur l'écran d'accueil |
