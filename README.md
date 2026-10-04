# Portfolio, Billal Kaamouchi

Portfolio d'un étudiant en **BTS SIO option SISR** (réseaux, systèmes, cybersécurité),
écrit à la main en HTML, CSS et JavaScript, sans framework et sans dépendance.

👉 **https://grfz9.github.io/portfolio/**

## Parti pris

Une page sobre, sur fond papier, avec une seule couleur d'accent et des angles droits.
Pas de dégradé, pas de flou d'arrière-plan, pas de bouton pilule, pas d'icône emoji.
Les contenus et les outils s'ouvrent dans des fenêtres déplaçables, redimensionnables
et empilables, lancées depuis la barre en bas de l'écran.

## Outils intégrés

| Outil | Description |
|-------|-------------|
| Terminal | Shell maison : `whoami`, `competences`, `ping`, `theme`, `open`, avec historique (flèches) et autocomplétion (tabulation) |
| Calculateur d'adressage IPv4 | Adresse réseau, broadcast, masque générique, plage d'hôtes, classe et type d'adresse |
| CV | Lecteur PDF intégré et téléchargement direct |
| Message | Formulaire qui prépare l'e-mail dans la messagerie de l'utilisateur |
| Réglages | Thème, animation du curseur, raccourcis clavier |

Deux jeux sont accessibles sans être référencés nulle part dans l'interface :
la commande `jeu` ou `p4` du terminal, la touche <kbd>P</kbd>, et le code Konami.

## Choix techniques

- **Aucune ressource tierce.** Polices du système, icônes en SVG intégré, pas de CDN.
  Consulter le site ne déclenche aucune requête vers un autre domaine.
- **Aucun cookie, aucun traceur.** Seules deux préférences d'affichage sont enregistrées
  dans le navigateur, documentées sur la page « Données personnelles ».
- **Accessibilité.** Contrastes vérifiés au niveau AA dans les deux thèmes, navigation au
  clavier, onglets avec attributs ARIA, respect de `prefers-reduced-motion`, contenu
  lisible sans JavaScript.
- **Adaptatif.** Sur mobile, les fenêtres deviennent des panneaux posés au-dessus de la barre.

## Structure

```
index.html        page principale
rgpd.html         données personnelles et mentions légales
style.css         système de design partagé
app.js            gestionnaire de fenêtres et applications
puissance4.html   fiches projet détaillées
wix-studio.html
montage-pc.html
favicon.svg, favicon.ico, icon-*.png, apple-touch-icon.png, site.webmanifest
CV_Billal_KAAMOUCHI.pdf
```

## Contact

billalkaamouchi@gmail.com, Sevran (93), Île-de-France
