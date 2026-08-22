(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const PASS_RATIO = .75;
  C.PASS_RATIO = PASS_RATIO;

  const previousSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    previousSpawn.call(this);
    const l = this.L();
    const required = Math.ceil(l.sats * PASS_RATIO);
    this.passRequired = required;
    const meteorWarning = l.meteor ? ' Attenzione: i meteoriti distruggono i razzi al contatto.' : '';
    this.ui.missionText.textContent = `${l.text}${meteorWarning} Obiettivo: porta nei dock almeno ${required} razz${required === 1 ? 'o' : 'i'} su ${l.sats} (${Math.round(PASS_RATIO * 100)}%).`;
  };

  P.settle = function(s, status, target = null) {
    if (s.status !== 'flying') return;
    s.status = status;
    if (status === 'docked') {
      this.docked++;
      if (target) target.uses++;
    } else {
      this.lost++;
    }
    this.telemetry();

    const l = this.L();
    if (this.released === l.sats && this.docked + this.lost === l.sats) {
      const required = this.passRequired || Math.ceil(l.sats * PASS_RATIO);
      const ok = this.docked >= required;

      if (ok) {
        const ratio = this.docked / l.sats;
        const bonus = Math.round(420 + this.levelIndex * 150 + l.sats * 55 + ratio * 420);
        this.score += bonus;
        const perfect = this.docked === l.sats;
        this.finish(
          true,
          perfect ? 'Flotta perfetta!' : `${this.docked}/${l.sats} in salvo`,
          perfect
            ? `Hai agganciato tutti i razzi. Bonus +${bonus}.`
            : `Missione superata: servivano ${required} razzi su ${l.sats} (75%) e ne hai salvati ${this.docked}. Bonus +${bonus}.`
        );
      } else {
        this.finish(
          false,
          `${this.docked}/${l.sats} in salvo`,
          `Per superare il livello devi agganciare almeno ${required} razzi su ${l.sats} (75%). Ne mancano ${required - this.docked}.`
        );
      }
    }
  };

  const objective = document.querySelector('.objective-title');
  if (objective) objective.textContent = 'SALVA ALMENO IL 75%!';
  const resultText = document.getElementById('resultText');
  if (resultText) resultText.textContent = 'Salva almeno il 75% della flotta per avanzare al livello successivo.';
})();
