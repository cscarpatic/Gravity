(() => {
  'use strict';

  window.GD = {
    levels: [
      { name:'Prima orbita', text:'Un satellite, un dock. Impara a piegare la traiettoria.', sats:1, docks:1, mass:1250, radius:31, speed:142, dockR:42, maxDock:205, type:'ocean', releaseInterval:0 },
      { name:'Doppio transito', text:'Due satelliti indipendenti: il secondo entra mentre il primo è ancora in volo.', sats:2, docks:1, mass:1720, radius:36, speed:150, dockR:40, maxDock:212, type:'rocky', releaseInterval:2.6 },
      { name:'Gigante gassoso', text:'Tre satelliti e due dock. Nuovi ingressi mentre leggi più traiettorie insieme.', sats:3, docks:2, mass:2550, radius:49, speed:160, dockR:38, maxDock:224, type:'gas', ring:true, releaseInterval:2.25 },
      { name:'Fionda multipla', text:'Quattro satelliti, due dock. Il traffico orbitale diventa più intenso.', sats:4, docks:2, mass:2350, radius:40, speed:182, dockR:36, maxDock:242, type:'lava', releaseInterval:1.95 },
      { name:'Sistema binario', text:'Cinque satelliti, tre dock e due masse. Ogni nuovo ingresso cambia il quadro.', sats:5, docks:3, mass:2200, radius:38, speed:188, dockR:34, maxDock:244, type:'ice', second:true, releaseInterval:1.7 },
      { name:'Gravità estrema', text:'Sei satelliti indipendenti e quattro dock. Pressione continua, nessuna formazione.', sats:6, docks:4, mass:3350, radius:46, speed:205, dockR:32, maxDock:258, type:'gas', ring:true, second:true, releaseInterval:1.45 }
    ],
    palettes: {
      ocean:['#e8fbff','#4a9ce7','#173a84','#79d0b4','#73dcff'],
      rocky:['#ffe8c9','#bd7355','#562d38','#75493f','#ffb080'],
      gas:['#fff1cf','#cf9364','#50365e','#efc58f','#dcb5ff'],
      lava:['#fff0c9','#d95c3d','#411725','#ffad45','#ff765b'],
      ice:['#f5fdff','#73cada','#274c79','#c5f6ff','#a9eeff'],
      violet:['#ffeaff','#a960cc','#43235c','#e5b1ff','#d991ff']
    },
    satPaint: [
      { body:'#eaf1ff', trim:'#8fb0ff', glow:'#7cc8ff', panel:'#5f79e8', engine:'#78efff' },
      { body:'#f6f3ff', trim:'#d9a3ff', glow:'#f39bff', panel:'#885ad3', engine:'#ffb6ff' },
      { body:'#f2fbff', trim:'#7ad8d6', glow:'#71ffe8', panel:'#2b8c9f', engine:'#9cf4ff' },
      { body:'#fff5eb', trim:'#ffb07a', glow:'#ffc55e', panel:'#ad5e39', engine:'#ffd38d' },
      { body:'#f0fff8', trim:'#8ce0a8', glow:'#8effbf', panel:'#3f8c67', engine:'#c8ffe3' },
      { body:'#eff4ff', trim:'#ff8aa7', glow:'#ff9abf', panel:'#a24a72', engine:'#ffd0dd' }
    ],
    anglePattern:[-.075,.052,-.118,.096,-.038,.132,-.15,.018],
    speedPattern:[.94,1.035,.985,1.075,.955,1.045,1,1.09],
    G:158,
    SOFTEN:34,
    DT:1/120,
    TRAIL_MAX:72
  };
})();