# 🥚 Tamagochi

Un animal virtuel en pixel art pour téléphone, façon Tamagotchi des années 90.
C'est une web-app installable (PWA) : elle s'ouvre dans le navigateur, s'ajoute à l'écran d'accueil et fonctionne hors-ligne.

## Le jeu

- **Le temps passe en vrai**, même quand l'appli est fermée : ton animal a faim, s'ennuie, se salit…
- **Évolution à branches** : Œuf (1 min) → Bébé → Enfant (après 1 jour) → Adulte (après 3 jours).
  La forme dépend de la façon dont tu t'en occupes :

  | Stade | Forme | Condition |
  |---|---|---|
  | Enfant | Kitsu | 2 erreurs de soin max |
  | Enfant | Grumo | 3 erreurs de soin ou + |
  | Adulte | Spectra | 6 erreurs de soin ou + |
  | Adulte | Drakor | 5 victoires ou + |
  | Adulte | Bouboule | Peser 25 g ou + |
  | Adulte | Lumen | Sinon |

  Une erreur de soin est comptée quand la faim tombe à zéro, quand l'hygiène devient critique ou quand il tombe malade.
- **Actions**
  - 🍙 **Nourrir** : 🍚 Riz, 🍖 Viande, 🍎 Fruit (bon pour la santé), 🍬 Bonbon et 🍰 Gâteau (rendent joyeux mais font grossir). Chaque forme a un **plat préféré** ❤️ et un **plat détesté** 🤢, à découvrir. Les friandises passent même le ventre plein… mais gare à l'indigestion.
  - 🎾 **Jouer** : 3 mini-jeux, avec meilleurs scores enregistrés
    - 🎯 **Gauche ou droite** : devine où il va regarder (5 manches)
    - 🍎 **Attrape-fruits** : 25 secondes pour attraper les fruits en évitant les cailloux (3 vies). Ce qu'il attrape le nourrit un peu.
    - 🦘 **Saut** : saute par-dessus les rochers, de plus en plus vite. Tape sur le bouton ou sur l'écran.
  - ⚔️ **Combat** : appuie sur *Tirer !* quand la jauge est haute (tout en haut : coup critique). Les adversaires deviennent plus forts à chaque victoire. Une défaite peut blesser ton monstre.
  - 🛁 **Laver** : nettoie les crottes
  - 💊 **Soigner** : guérit quand une tête de mort apparaît
  - 💤 **Sieste / Réveiller** le jour, 🌙 **Éteindre / Allumer** la nuit
- **Jour et nuit sur la vraie horloge** : il s'endort tout seul (20 h bébé, 21 h enfant, 22 h adulte) et se réveille à 8 h. Pense à éteindre la lumière : au-delà de 30 minutes allumée, ça compte comme une erreur de soin, et il dort mal.
- ⚙️ **Réglages** : 6 couleurs de coque, sons 8 bits (activables ou non), notifications.
- 🔔 **Notifications** : sans serveur, elles fonctionnent quand l'appli tourne en arrière-plan et, sur Android avec l'appli installée, via une vérification périodique décidée par Chrome (quelques fois par jour). Sur iPhone, elles ne peuvent pas arriver quand l'appli est fermée.
- 📖 **Digidex** : la collection des formes obtenues et des adversaires vaincus, conservée même après la mort de ton monstre.
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
