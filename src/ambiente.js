import { CONFIG } from "./config.js";

const ARQUIVO = CONFIG.som.arquivo;
const VOLUME = CONFIG.som.volume;

export function criarSomAmbiente() {
  const audio = new Audio(ARQUIVO);
  audio.loop = true;
  audio.volume = VOLUME;

  let comecou = false;

  function iniciar() {
    if (!audio.paused) return;
    audio.play()
      .then(() => { comecou = true; })
      .catch(() => {});
  }

  function alternarMudo() {
    audio.muted = !audio.muted;
    return audio.muted;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      audio.pause();
    } else if (comecou) {
      audio.play().catch(() => {});
    }
  });

  return { iniciar, alternarMudo };
}
