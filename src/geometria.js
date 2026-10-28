import * as twgl from "./twgl.js";

const m4 = twgl.m4;
const {
  createSphereVertices,
  createTruncatedConeVertices,
  reorientVertices,
  concatVertices,
} = twgl.primitives;

export function criarAleatorio(semente) {
  let estado = semente >>> 0;
  return function () {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ruidoDePosicao(x, y, z, semente) {
  const q = (n) => Math.round(n * 1000) / 1000;
  const s = Math.sin(q(x) * 12.9898 + q(y) * 78.233 + q(z) * 37.719 + semente * 19.19) * 43758.5453;
  return s - Math.floor(s);
}

export function facetar(vertices) {
  const { position, texcoord, indices } = vertices;
  const n = indices.length;
  const novaPosicao = new Float32Array(n * 3);
  const novaNormal = new Float32Array(n * 3);
  const novaTexcoord = new Float32Array(n * 2);
  const novosIndices = n > 65535 ? new Uint32Array(n) : new Uint16Array(n);

  for (let t = 0; t < n; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;

    const ux = position[b] - position[a];
    const uy = position[b + 1] - position[a + 1];
    const uz = position[b + 2] - position[a + 2];
    const vx = position[c] - position[a];
    const vy = position[c + 1] - position[a + 1];
    const vz = position[c + 2] - position[a + 2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const tamanho = Math.hypot(nx, ny, nz);
    if (tamanho > 1e-12) {
      nx /= tamanho; ny /= tamanho; nz /= tamanho;
    } else {
      nx = 0; ny = 1; nz = 0; 
    }

    for (let k = 0; k < 3; k++) {
      const origem = indices[t + k];
      const destino = t + k;
      novaPosicao.set(position.subarray(origem * 3, origem * 3 + 3), destino * 3);
      novaNormal.set([nx, ny, nz], destino * 3);
      novaTexcoord.set(texcoord.subarray(origem * 2, origem * 2 + 2), destino * 2);
      novosIndices[destino] = destino;
    }
  }

  return { position: novaPosicao, normal: novaNormal, texcoord: novaTexcoord, indices: novosIndices };
}


export function gerarVerticesPedra(raio, semente) {
  const vertices = createSphereVertices(raio, 6, 5);
  const pos = vertices.position;
  const piso = -0.45 * raio;

  for (let i = 0; i < pos.length; i += 3) {
    const f = 0.72 + 0.56 * ruidoDePosicao(pos[i], pos[i + 1], pos[i + 2], semente);
    pos[i] *= f;
    pos[i + 1] = Math.max(pos[i + 1] * f * 0.8, piso);
    pos[i + 2] *= f;
  }


  let menorY = Infinity;
  for (let i = 1; i < pos.length; i += 3) menorY = Math.min(menorY, pos[i]);
  for (let i = 1; i < pos.length; i += 3) pos[i] -= menorY + 0.05 * raio;

  return facetar(vertices);
}


export function gerarVerticesTufo(semente) {
  const rng = criarAleatorio(semente);
  const quantidade = 6 + Math.floor(rng() * 3);
  const alturaMaxima = 0.9;
  const partes = [];

  for (let i = 0; i < quantidade; i++) {
    const altura = 0.45 + rng() * (alturaMaxima - 0.45);
    const lamina = createTruncatedConeVertices(0.09, 0, altura, 4, 1, true, true);

    const inclinacao = (6 + rng() * 28) * (Math.PI / 180);
    const giro = rng() * Math.PI * 2;
    const afastamento = rng() * 0.07;

    let m = m4.scaling([1, 1, 0.3]);                        
    m = m4.multiply(m4.translation([0, altura / 2, 0]), m); 
    m = m4.multiply(m4.rotationZ(inclinacao), m);           
    m = m4.multiply(m4.translation([afastamento, 0, 0]), m); 
    m = m4.multiply(m4.rotationY(giro), m);                 
    partes.push(reorientVertices(lamina, m));
  }

  const tufo = concatVertices(partes);

  for (let i = 0; i < tufo.texcoord.length / 2; i++) {
    const y = tufo.position[i * 3 + 1];
    tufo.texcoord[i * 2 + 1] = Math.min(Math.max(y / alturaMaxima, 0), 1);
  }

  return facetar(tufo);
}

export const ALTURA_TRONCO = 1.5;

export function gerarVerticesTronco() {
  const tronco = createTruncatedConeVertices(0.22, 0.14, ALTURA_TRONCO, 7, 1, true, true);
  return facetar(reorientVertices(tronco, m4.translation([0, ALTURA_TRONCO / 2, 0])));
}

export function gerarVerticesCopa(semente) {
  const vertices = createSphereVertices(0.9, 7, 6);
  const pos = vertices.position;
  for (let i = 0; i < pos.length; i += 3) {
    const f = 0.85 + 0.3 * ruidoDePosicao(pos[i], pos[i + 1], pos[i + 2], semente);
    pos[i] *= f;
    pos[i + 1] *= f;
    pos[i + 2] *= f;
  }
  return facetar(vertices);
}

export const criarMalhaPedra = (gl, raio, semente) =>
  twgl.createBufferInfoFromArrays(gl, gerarVerticesPedra(raio, semente));
export const criarMalhaTufo = (gl, semente) =>
  twgl.createBufferInfoFromArrays(gl, gerarVerticesTufo(semente));
export const criarMalhaTronco = (gl) =>
  twgl.createBufferInfoFromArrays(gl, gerarVerticesTronco());
export const criarMalhaCopa = (gl, semente) =>
  twgl.createBufferInfoFromArrays(gl, gerarVerticesCopa(semente));
