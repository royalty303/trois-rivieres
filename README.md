# Au fil de la ville · Trois-Rivières

Trois-Rivières d'hier et d'aujourd'hui : un récit en 13 étapes, des plans anciens superposés à la carte actuelle et un répertoire des lieux.
En ligne : https://royalty303.github.io/trois-rivieres/

- Page unique `index.html`, servie par GitHub Pages ; images dans `img/`. Leaflet 1.9.4 est intégré à la page.
- Sources de travail dans `src/` (`python3 build.py` depuis `src/`, avec leaflet.js et leaflet.css 1.9.4 à côté) : `app.html` (gabarit), `data.js` (lieux et étapes du récit), `app.js` (navigation et cartes).
- Vues : `#accueil`, `#recit-N`, `#carte`, `#lieux`, `#sources`.
- Fonds de carte Esri sans clé (ne pas utiliser CARTO, qui exige une clé).
- Plan Goad 1888-1903 et périmètre du feu de 1908 calés par trois coins (`DOCS.geo`), à partir de la cathédrale, du séminaire,
  de l'église St. James et du site de l'ancienne église paroissiale ; écart résiduel ≈ 20 m.
  Les plans de 1685 à 1815 ne sont pas superposés : sans points de contrôle vérifiables, le calage serait inventé.
- Aucun renvoi à la conférence dans les textes ; elle figure dans la page Sources.
