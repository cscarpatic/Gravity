# Gravity Dock

Puzzle gravitazionale touch-first in HTML/CSS/JavaScript, pensato per GitHub Pages e ottimizzato per Safari su iPhone e iPad.

## Come si gioca

I satelliti entrano nel settore orbitale contemporaneamente. Trascina il pianeta mobile per modificare in tempo reale il campo gravitazionale e portarli nei dock sulla destra senza collisioni o satelliti persi.

I dock sono riutilizzabili: nei livelli avanzati ce ne sono meno dei satelliti, quindi più traiettorie devono convergere sugli stessi punti di arrivo.

### Progressione

| Livello | Satelliti simultanei | Dock |
| --- | ---: | ---: |
| 1 | 1 | 1 |
| 2 | 2 | 1 |
| 3 | 3 | 2 |
| 4 | 4 | 2 |
| 5 | 5 | 3 |
| 6 | 6 | 4 |

Dal livello 5 compare anche una seconda massa gravitazionale fissa.

## Grafica

I pianeti sono renderizzati proceduralmente in Canvas con effetto pseudo-3D: illuminazione sferica, terminatore giorno/notte, atmosfera, texture, bande gassose, dettagli superficiali, glow e anelli prospettici. Non sono richieste immagini o librerie esterne.

## Tecnica

- HTML5 Canvas
- JavaScript vanilla
- CSS responsive con safe-area iOS
- Pointer Events per touch, mouse e Apple Pencil
- timestep fisso a 120 Hz per la simulazione fisica
- devicePixelRatio limitato a 2 per bilanciare nitidezza e prestazioni su dispositivi Retina
- nessuna dipendenza, build o backend

## GitHub Pages

Pubblica la root del branch scelto con GitHub Pages. `.nojekyll` è incluso.

## Satelliti indipendenti

Nei livelli avanzati più satelliti sono attivi contemporaneamente, ma ciascuno è simulato come corpo indipendente: posizione, velocità, accelerazione gravitazionale, scia, collisioni e docking sono calcolati separatamente. Il numero di dock cresce più lentamente del numero di satelliti e ogni dock può essere riutilizzato.
