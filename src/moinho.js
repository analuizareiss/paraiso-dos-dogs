import * as twgl from "./twgl.js";
import { facetar } from "./geometria.js";

const m4 = twgl.m4;
const {
  createTruncatedConeVertices,
  createSphereVertices,
  createCubeVertices,
  reorientVertices,
} = twgl.primitives;


export const POSICAO_MOINHO = { x: 2.6, z: -1.6, r: 1.45 };

const ALTURA_TORRE = 1.6;
const ALTURA_TELHADO = 0.7;
const ALTURA_EIXO = 1.45;      
const Z_EIXO = 0.3;           
const COMPRIMENTO_EIXO = 0.38; 
const RAIO_CUBO = 0.13;
const COMPRIMENTO_PA = 1.1;
const LARGURA_PA = 0.22;
const ESPESSURA_PA = 0.04;
const VELOCIDADE = 0.8;       

const MATERIAL = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.05, 0.05, 0.05], brilho: 6 };

function criarMalha(gl, vertices) {
  return twgl.createBufferInfoFromArrays(gl, vertices);
}

function torre(gl) {
  const v = createTruncatedConeVertices(0.55, 0.38, ALTURA_TORRE, 8, 1, true, true);
  return criarMalha(gl, facetar(reorientVertices(v, m4.translation([0, ALTURA_TORRE / 2, 0]))));
}

function telhado(gl) {
  const v = createTruncatedConeVertices(0.62, 0, ALTURA_TELHADO, 8, 1, true, true);
  return criarMalha(gl, facetar(reorientVertices(v, m4.translation([0, ALTURA_TELHADO / 2, 0]))));
}

function eixo(gl) {
  const v = createTruncatedConeVertices(0.05, 0.05, COMPRIMENTO_EIXO, 6, 1, true, true);
  const m = m4.multiply(m4.translation([0, 0, COMPRIMENTO_EIXO / 2]), m4.rotationX(Math.PI / 2));
  return criarMalha(gl, facetar(reorientVertices(v, m)));
}

function cubo(gl) {
  return criarMalha(gl, facetar(createSphereVertices(RAIO_CUBO, 8, 6)));
}

function pa(gl) {
  const v = createCubeVertices(1);
  const m = m4.scaling([LARGURA_PA, COMPRIMENTO_PA, ESPESSURA_PA]);
  return criarMalha(gl, reorientVertices(v, m));
}

export function criarMoinho(gl, carregarTextura) {
  const texturaTorre = carregarTextura(gl, "assets/pedra.png");
  const texturaMadeira = carregarTextura(gl, "assets/casca.png");

  const malhaPa = pa(gl);
  const pas = [0, 1, 2, 3].map((i) => ({
    nome: "pá",
    malha: malhaPa,
    material: MATERIAL,
    textura: texturaMadeira,
    repeticao: 1,
    modelo: m4.multiply(
      m4.rotationZ(i * Math.PI / 2),
      m4.translation([0, RAIO_CUBO + COMPRIMENTO_PA / 2, 0])
    ),
    filhos: [],
  }));

  const cuboDasPas = {
    nome: "cubo das pás",
    malha: cubo(gl),
    material: MATERIAL,
    textura: texturaMadeira,
    repeticao: 1,
    modelo: m4.translation([0, 0, COMPRIMENTO_EIXO]),
    filhos: pas,
  };

  const posicaoDoEixo = m4.translation([0, ALTURA_EIXO, Z_EIXO]);
  const eixoGiratorio = {
    nome: "eixo",
    malha: eixo(gl),
    material: MATERIAL,
    textura: texturaMadeira,
    repeticao: 1,
    modelo: posicaoDoEixo,
    filhos: [cuboDasPas],
  };

  const cobertura = {
    nome: "telhado",
    malha: telhado(gl),
    material: MATERIAL,
    textura: texturaMadeira,
    repeticao: 2,
    modelo: m4.translation([0, ALTURA_TORRE, 0]),
    filhos: [],
  };

  const giro = Math.atan2(-POSICAO_MOINHO.x, -POSICAO_MOINHO.z);
  const posicao = m4.multiply(
    m4.translation([POSICAO_MOINHO.x, 0, POSICAO_MOINHO.z]),
    m4.rotationY(giro)
  );

  const raiz = {
    nome: "moinho",
    malha: torre(gl),
    material: MATERIAL,
    textura: texturaTorre,
    repeticao: 2,
    modelo: posicao,
    filhos: [cobertura, eixoGiratorio],
  };

  let angulo = 0;

  function atualizar(dt) {
    angulo += VELOCIDADE * dt;
    eixoGiratorio.modelo = m4.multiply(posicaoDoEixo, m4.rotationZ(angulo));
  }

  return { raiz, atualizar };
}