const ARQUIVO = "assets/ambiente.mp3";
const VOLUME = 0.5;

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
