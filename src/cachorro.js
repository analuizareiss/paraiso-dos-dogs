import * as twgl from "./twgl.js";
import { criarAleatorio } from "./geometria.js";

const m4 = twgl.m4;
const GRAUS = Math.PI / 180;

const CORES = {
  creme: [244, 236, 220],
  caramelo: [178, 122, 70],
  marrom: [104, 68, 42],
  preto: [26, 22, 22],
  laco: [222, 70, 100],
};

const MATERIAL_PELO = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.04, 0.04, 0.04], brilho: 8 };
const MATERIAL_BRILHANTE = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.8, 0.8, 0.8], brilho: 60 };
const MATERIAL_LACO = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.3, 0.3, 0.3], brilho: 30 };

function limitar(valor) {
  return Math.min(Math.max(Math.round(valor), 0), 255);
}

function criarTexturaPelo(gl, [r, g, b], semente) {
  const tamanho = 64;
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, tamanho, tamanho);

  const rng = criarAleatorio(semente);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 280; i++) {
    const delta = rng() < 0.5 ? 16 : -24;
    ctx.strokeStyle = `rgb(${limitar(r + delta)}, ${limitar(g + delta)}, ${limitar(b + delta)})`;
    const x = rng() * tamanho;
    const y = rng() * tamanho;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 3, y + 3 + rng() * 8);
    ctx.stroke();
  }

  return twgl.createTexture(gl, {
    src: canvas,
    min: gl.LINEAR_MIPMAP_LINEAR,
    mag: gl.LINEAR,
    wrap: gl.REPEAT,
  });
}

// para olho, nariz e laço
function criarTexturaSolida(gl, [r, g, b]) {
  return twgl.createTexture(gl, {
    src: [r, g, b, 255],
    width: 1,
    height: 1,
    min: gl.NEAREST,
    mag: gl.NEAREST,
  });
}

// T * Rz * Ry * Rx * S
function montarModelo({ pos = [0, 0, 0], rot = [0, 0, 0], escala = [1, 1, 1] }) {
  let m = m4.translation(pos);
  m = m4.multiply(m, m4.rotationZ(rot[2] * GRAUS));
  m = m4.multiply(m, m4.rotationY(rot[1] * GRAUS));
  m = m4.multiply(m, m4.rotationX(rot[0] * GRAUS));
  m = m4.multiply(m, m4.scaling(escala));
  return m;
}

function atualizarModelo(no) {
  no.modelo = montarModelo(no);
}

function articulacao(nome, pos, filhos = [], rot = [0, 0, 0]) {
  const no = { nome, pos, rot, escala: [1, 1, 1], filhos };
  atualizarModelo(no);
  return no;
}

function malhaDe(nome, malha, textura, material, { pos = [0, 0, 0], rot = [0, 0, 0], escala = [1, 1, 1] }, repeticao = 2) {
  const no = { nome, malha, textura, material, repeticao, pos, rot, escala, filhos: [] };
  atualizarModelo(no);
  return no;
}

// para transições suaves entre as poses
function misturar(a, b, t) {
  if (typeof a === "number"){
    return a + (b - a) * t;
  }
  if (Array.isArray(a)){
    return a.map((valor, i) => misturar(valor, b[i], t));
  }

  const resultado = {};
  for (const chave in a){
    resultado[chave] = misturar(a[chave], b[chave], t);
  }

  return resultado;
}

function giroParaOlhar(posicao, alvo) {
  return Math.atan2(alvo[0] - posicao[0], alvo[2] - posicao[2]) / GRAUS;
}

function diferencaAngular(de, para) {
  return ((((para - de) % 360) + 540) % 360) - 180;
}

// array das diferentes poses do cachorro, com posição, rotação e juntas (posição, rotação e escala de cada parte)
export const POSES = [
  {
    nome: "em pé",
    posicao: [0, 0, 0],
    giroY: 30,
    juntas: {},
  },
  {
    nome: "sentado na borda",
    posicao: [4.15, 0, 0.37],
    olharPara: [0, 0, 0],
    juntas: {
      corpo: { pos: [0, 0.345, 0], rot: [-28, 0, 0] },
      cabeca: { rot: [20, 0, 0] },
      rabo: { rot: [-60, 0, 0] },
      // patas esticadas
      pataDianteiraEsq: { rot: [28, 0, 0], escala: [1, 1.3, 1] },
      pataDianteiraDir: { rot: [28, 0, 0], escala: [1, 1.3, 1] },
      // patas dobradas
      pataTraseiraEsq: { pos: [0.2, -0.12, -0.2], rot: [-95, 0, 0], escala: [1, 0.6, 1] },
      pataTraseiraDir: { pos: [-0.2, -0.12, -0.2], rot: [-95, 0, 0], escala: [1, 0.6, 1] },
    },
  },
  {
    nome: "dormindo de barriga pra cima",
    posicao: [-0.9, 0, -0.5],
    giroY: -60,
    juntas: {
      corpo: { pos: [0, 0.29, 0], rot: [0, 0, 180] },
      cabeca: { rot: [0, 0, 180] },
      rabo: { rot: [-80, 0, 0] },
      pontaRabo: { rot: [0, 0, 0] },
      orelhaEsq: { rot: [0, 0, 25] },
      orelhaDir: { rot: [0, 0, -25] },
      pataDianteiraEsq: { rot: [50, 0, 0] },
      pataDianteiraDir: { rot: [50, 0, 0] },
      pataTraseiraEsq: { rot: [-40, 0, 0] },
      pataTraseiraDir: { rot: [-40, 0, 0] },
      // olhos fechados
      olhoEsq: { escala: [0.03, 0.006, 0.025] },
      olhoDir: { escala: [0.03, 0.006, 0.025] },
    },
  },
];

export function criarCachorro(gl) {
  const esfera = twgl.primitives.createSphereBufferInfo(gl, 1, 24, 16);
  const cone = twgl.primitives.createTruncatedConeBufferInfo(gl, 0.07, 0.085, 1, 14, 1, false, true);

  const tex = {
    creme: criarTexturaPelo(gl, CORES.creme, 11),
    caramelo: criarTexturaPelo(gl, CORES.caramelo, 22),
    marrom: criarTexturaPelo(gl, CORES.marrom, 33),
    preto: criarTexturaSolida(gl, CORES.preto),
    laco: criarTexturaSolida(gl, CORES.laco),
  };

  // cabeça
  const olhoEsq = malhaDe("olho esquerdo", esfera, tex.preto, MATERIAL_BRILHANTE,
    { pos: [0.09, 0.08, 0.27], escala: [0.03, 0.03, 0.025] }, 1);
  const olhoDir = malhaDe("olho direito", esfera, tex.preto, MATERIAL_BRILHANTE,
    { pos: [-0.09, 0.08, 0.27], escala: [0.03, 0.03, 0.025] }, 1);

  const orelhaEsq = articulacao("orelha esquerda", [0.19, 0.10, 0.05], [
    malhaDe("orelha", esfera, tex.marrom, MATERIAL_PELO,
      { pos: [0.02, -0.08, 0], escala: [0.05, 0.13, 0.09] }),
  ], [0, 0, 10]);
  const orelhaDir = articulacao("orelha direita", [-0.19, 0.10, 0.05], [
    malhaDe("orelha", esfera, tex.marrom, MATERIAL_PELO,
      { pos: [-0.02, -0.08, 0], escala: [0.05, 0.13, 0.09] }),
  ], [0, 0, -10]);

  const cabeca = articulacao("cabeça", [0, 0.09, 0.35], [
    malhaDe("crânio", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, 0.06, 0.10], escala: [0.225, 0.20, 0.21] }),
    malhaDe("barba", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, -0.06, 0.17], escala: [0.19, 0.14, 0.15] }),
    malhaDe("topete", esfera, tex.caramelo, MATERIAL_PELO,
      { pos: [0, 0.21, 0.05], escala: [0.075, 0.07, 0.075] }),
    malhaDe("laço", esfera, tex.laco, MATERIAL_LACO,
      { pos: [0, 0.27, 0.05], escala: [0.06, 0.04, 0.04] }, 1),
    malhaDe("focinho", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, -0.02, 0.28], escala: [0.10, 0.075, 0.09] }),
    malhaDe("nariz", esfera, tex.preto, MATERIAL_BRILHANTE,
      { pos: [0, 0.0, 0.355], escala: [0.04, 0.032, 0.03] }, 1),
    olhoEsq,
    olhoDir,
    orelhaEsq,
    orelhaDir,
  ]);

  // rabo
  const pontaRabo = articulacao("ponta do rabo", [0, 0.14, 0], [
    malhaDe("pluma", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, 0.06, 0], escala: [0.12, 0.12, 0.12] }),
  ], [50, 0, 0]);
  const rabo = articulacao("rabo", [0, 0.12, -0.42], [
    malhaDe("base do rabo", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, 0.07, 0], escala: [0.09, 0.11, 0.09] }),
    pontaRabo,
  ], [-15, 0, 0]);

  // patas
  function criarPata(nome, x, z) {
    return articulacao(nome, [x, -0.08, z], [
      malhaDe("perna", cone, tex.creme, MATERIAL_PELO,
        { pos: [0, -0.15, 0], escala: [1, 0.30, 1] }),
      malhaDe("pata", esfera, tex.creme, MATERIAL_PELO,
        { pos: [0, -0.25, 0.02], escala: [0.085, 0.05, 0.105] }),
    ]);
  }
  const pataDianteiraEsq = criarPata("pata dianteira esquerda", 0.15, 0.26);
  const pataDianteiraDir = criarPata("pata dianteira direita", -0.15, 0.26);
  const pataTraseiraEsq = criarPata("pata traseira esquerda", 0.16, -0.26);
  const pataTraseiraDir = criarPata("pata traseira direita", -0.16, -0.26);

  // corpo
  const corpo = articulacao("corpo", [0, 0.38, 0], [
    malhaDe("tronco", esfera, tex.creme, MATERIAL_PELO,
      { escala: [0.27, 0.25, 0.46] }, 3),
    malhaDe("manto", esfera, tex.caramelo, MATERIAL_PELO,
      { pos: [0, 0.035, -0.10], escala: [0.285, 0.235, 0.30] }, 3),
    malhaDe("saia de pelo", esfera, tex.creme, MATERIAL_PELO,
      { pos: [0, -0.13, 0], escala: [0.33, 0.14, 0.43] }, 3),
    cabeca,
    rabo,
    pataDianteiraEsq,
    pataDianteiraDir,
    pataTraseiraEsq,
    pataTraseiraDir,
  ]);

  const raiz = articulacao("cachorro", [0, 0, 0], [corpo]);

  // nós que as poses podem mexer (posição, rotação e escala)
  const partes = {
    corpo,
    cabeca,
    orelhaEsq,
    orelhaDir,
    rabo,
    pontaRabo,
    pataDianteiraEsq,
    pataDianteiraDir,
    pataTraseiraEsq,
    pataTraseiraDir,
    olhoEsq,
    olhoDir,
  };

  // pose neutra
  const neutro = {};
  for (const chave in partes) {
    const { pos, rot, escala } = partes[chave];
    neutro[chave] = { pos: [...pos], rot: [...rot], escala: [...escala] };
  }

  function resolverPose(pose) {
    const juntas = {};
    for (const chave in neutro) {
      juntas[chave] = { ...neutro[chave], ...pose.juntas[chave] };
    }
    const giroY = pose.olharPara ? giroParaOlhar(pose.posicao, pose.olharPara) : pose.giroY;
    return { posicao: pose.posicao, giroY, juntas };
  }

  function aplicar(retrato, pulo = 0) {
    const [x, y, z] = retrato.posicao;
    raiz.pos = [x, y + pulo, z];
    raiz.rot = [0, retrato.giroY, 0];
    atualizarModelo(raiz);
    for (const chave in partes) {
      const { pos, rot, escala } = retrato.juntas[chave];
      Object.assign(partes[chave], { pos, rot, escala });
      atualizarModelo(partes[chave]);
    }
  }

  let indicePose = 0;
  let atual = resolverPose(POSES[indicePose]);
  let origem = atual;
  let destino = atual;
  let progresso = 1;
  aplicar(atual);

  function irParaPose(indice) {
    indicePose = indice % POSES.length;
    origem = atual;
    destino = resolverPose(POSES[indicePose]);
    destino.giroY = origem.giroY + diferencaAngular(origem.giroY, destino.giroY);
    progresso = 0;
  }

  function proximaPose() {
    irParaPose(indicePose + 1);
  }
  
  const suavizar = (t) => t * t * (3 - 2 * t);

  function atualizar(dt) {
    const DURACAO_TRANSICAO = 1.2;
    const ALTURA_PULINHO = 0.25;
  
    if (progresso >= 1) return;
  
    progresso = Math.min(progresso + dt / DURACAO_TRANSICAO, 1);
    const t = suavizar(progresso);
    atual = misturar(origem, destino, t);
    const mudouDeLugar = origem.posicao[0] !== destino.posicao[0] || origem.posicao[2] !== destino.posicao[2];
    const pulo = mudouDeLugar ? ALTURA_PULINHO * Math.sin(Math.PI * progresso) : 0;
    aplicar(atual, pulo);
  }

  return {
    raiz,
    partes,
    proximaPose,
    irParaPose,
    atualizar,
    get nomePose() {
      return POSES[indicePose].nome;
    },
  };
}