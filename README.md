# Gravity Dock

Un piccolo puzzle game basato sull'attrazione gravitazionale: sposta i pianeti per deviare la traiettoria dei satelliti e guidarli nel punto di atterraggio.

## Gioca

Il progetto è pensato per essere pubblicato direttamente con GitHub Pages. Non richiede build, framework o dipendenze esterne.

## Controlli

- **iPhone / iPad:** trascina il pianeta con un dito.
- **Desktop:** trascina il pianeta con mouse o trackpad.
- La linea tratteggiata mostra una previsione della traiettoria del satellite.
- Porta il satellite nel portale `DOCK` senza collisioni e con una velocità compatibile con l'atterraggio.

## Livelli

Il prototipo include 6 livelli con variazioni di:

- massa e raggio dei pianeti;
- velocità iniziale del satellite;
- posizione e dimensione del dock;
- sistemi con più corpi gravitazionali.

## GitHub Pages

1. Apri **Settings → Pages** nella repository.
2. In **Build and deployment**, scegli **Deploy from a branch**.
3. Seleziona `main` e `/ (root)`.
4. Salva.

GitHub pubblicherà il gioco usando `index.html` nella root.

## Struttura

```text
.
├── index.html
├── game.js
├── styles.css
├── .nojekyll
└── README.md
```

## Tecnologia

- HTML5
- CSS3
- JavaScript vanilla
- Canvas 2D
- Pointer Events
- simulazione fisica a timestep fisso
- rendering adattivo per display Retina

Il progetto è ottimizzato per browser moderni, con particolare attenzione a Safari su iPhone e iPad.
