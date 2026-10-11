# Portfolio — Billal Kaamouchi

Portfolio interactif d'un étudiant en **BTS SIO option SISR** (réseaux, systèmes, cybersécurité),
construit à la main en HTML / CSS / JavaScript, sans framework ni dépendance.

👉 **https://grfz9.github.io/portfolio/**

## L'idée : « BK/OS »

Plutôt qu'une page qui déroule des informations, le site se comporte comme un petit système
d'exploitation. Les contenus et les démos s'ouvrent dans des **fenêtres déplaçables,
redimensionnables et empilables**, lancées depuis le dock en bas de l'écran.

## Applications intégrées

| App | Description |
|-----|-------------|
| ▶_ Terminal | Shell maison : `whoami`, `skills`, `ping`, `neofetch`, `theme`, `open`… avec historique (↑/↓) et autocomplétion (Tab) |
| 🖧 Calculateur IP / CIDR | Adresse réseau, broadcast, masque générique, plage d'hôtes, classe et type d'adresse |
| ♟️ Puissance 4 | Portage web du projet Java, avec une IA minimax à élagage alpha-bêta en 3 niveaux |
| 👾 Space Invaders | Jeu canvas, clavier ou tactile |
| 📄 CV · ✉️ Contact · ◐ Thèmes | Lecteur PDF intégré, formulaire mailto, et 4 thèmes de couleurs |

## Fonctionnalités

- 4 thèmes (Cyber, Aurora, Solar, Clair), mémorisés dans le navigateur
- Séquence de démarrage au premier chargement
- Fond animé : maillage réseau en canvas, halos colorés, halo de souris
- Animations d'apparition au scroll, compteurs et jauges de compétences
- Raccourcis clavier : `T` terminal · `P` Puissance 4 · `I` calculateur IP · `Échap` fermer
- Responsive : les fenêtres deviennent des panneaux plein écran sur mobile
- Respect de `prefers-reduced-motion` et possibilité de couper tous les effets

## Structure

```
index.html        page principale (BK/OS)
style.css         design system partagé (tokens, thèmes, composants, fenêtres)
app.js            gestionnaire de fenêtres + applications
puissance4.html   fiches projet détaillées
wix-studio.html
montage-pc.html
rgpd.html         politique de confidentialité
cgu.html          mentions légales et CGU
404.html          page d'erreur (chemins absolus /portfolio/)
fonts/            Inter et JetBrains Mono auto-hébergées (licence OFL)
img/              favicons, icônes et image de partage 1200x630
favicon.ico · site.webmanifest · sitemap.xml · robots.txt
CV_Billal_KAAMOUCHI.pdf
```

## Statistiques

Mesure d'audience par [GoatCounter](https://www.goatcounter.com), sans cookie : créer un compte
avec le code `grfz9` pour que le compteur `https://grfz9.goatcounter.com/count` reçoive les visites.

## Contact

📧 billalkaamouchi@gmail.com · 📍 Sevran (93) · Île-de-France
