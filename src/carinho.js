import * as twgl from "./twgl.js";

const m4 = twgl.m4;

function raioContraEsfera(origem, direcao, centro, raio) {
  const oc = [origem[0] - centro[0], origem[1] - centro[1], origem[2] - centro[2]];
  const b = oc[0] * direcao[0] + oc[1] * direcao[1] + oc[2] * direcao[2];
  const c = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - raio * raio;
  const delta = b * b - c;
  if (delta < 0) return null;
  const raiz = Math.sqrt(delta);
  const t = -b - raiz;
  if (t >= 0) return t;
  return -b + raiz >= 0 ? -b + raiz : null;
}

export function criarCarinho({ canvas, cachorro, balao }) {
  let projecao = m4.identity();
  let visao = m4.identity();

  let acariciando = false;

  function raioDoMouse(e) {
    const retangulo = canvas.getBoundingClientRect();
    const x = ((e.clientX - retangulo.left) / retangulo.width) * 2 - 1;
    const y = 1 - ((e.clientY - retangulo.top) / retangulo.height) * 2;

    const inversa = m4.inverse(m4.multiply(projecao, visao));
    const perto = m4.transformPoint(inversa, [x, y, -1]);
    const longe = m4.transformPoint(inversa, [x, y, 1]);

    const d = [longe[0] - perto[0], longe[1] - perto[1], longe[2] - perto[2]];
    const tamanho = Math.hypot(d[0], d[1], d[2]);
    return { origem: perto, direcao: [d[0] / tamanho, d[1] / tamanho, d[2] / tamanho] };
  }

  function mouseEstaNoCachorro(e) {
    const { origem, direcao } = raioDoMouse(e);
    return cachorro.esferasDeToque().some(
      (esfera) => raioContraEsfera(origem, direcao, esfera.centro, esfera.raio) !== null
    );
  }

  function aoPressionar(e) {
    if (!mouseEstaNoCachorro(e)) return false;
    acariciando = true;
    cachorro.acariciar(0.25);
    canvas.style.cursor = "grabbing";
    return true;
  }

  function aoMover(e) {
    const sobreOCachorro = mouseEstaNoCachorro(e);

    if (!acariciando) {
      canvas.style.cursor = sobreOCachorro ? "grab" : "default";
      return;
    }

    if (!sobreOCachorro) return;
    const distancia = Math.hypot(e.movementX, e.movementY);
    cachorro.acariciar(distancia * 0.003);
  }

  function aoSoltar() {
    acariciando = false;
    canvas.style.cursor = "default";
  }

  function atualizarBalao() {
    const alegria = cachorro.alegria;
    if (alegria < 0.15) {
      balao.style.opacity = 0;
      return;
    }
    const p = m4.transformPoint(m4.multiply(projecao, visao), cachorro.pontoDoBalao());
    const retangulo = canvas.getBoundingClientRect();
    balao.style.left = `${retangulo.left + (p[0] * 0.5 + 0.5) * retangulo.width}px`;
    balao.style.top = `${retangulo.top + (-p[1] * 0.5 + 0.5) * retangulo.height}px`;
    balao.style.opacity = Math.min((alegria - 0.15) * 3, 1);
    balao.textContent = alegria > 0.8 ? "😍" : alegria > 0.45 ? "😊" : "🙂";
  }

  function atualizar(novaProjecao, novaVisao) {
    projecao = novaProjecao;
    visao = novaVisao;
    atualizarBalao();
  }

  return { aoPressionar, aoMover, aoSoltar, atualizar };
}
