import * as twgl from "./twgl.js";
import {
  criarAleatorio,
  criarMalhaPedra,
  criarMalhaTufo,
  criarMalhaTronco,
  criarMalhaCopa,
  ALTURA_TRONCO,
} from "./geometria.js";

const m4 = twgl.m4;

const FOLGA_BORDA = 0.15;   
const FOLGA_ENTRE = 0.1;   

export function sortearLayout(raioDiorama, semente) {
  const rng = criarAleatorio(semente);

  const ocupados = [
    { x: 0, z: 0, r: 1.8 },     
    { x: 2.6, z: -1.6, r: 1.0 }, 
  ];

  function sortear(quantidade, raioMin, raioMax, sortearTamanho) {
    const colocados = [];
    for (let i = 0; i < quantidade; i++) {
      for (let tentativa = 0; tentativa < 300; tentativa++) {
        const tamanho = sortearTamanho(rng);
        const distancia = Math.sqrt(raioMin ** 2 + rng() * (raioMax ** 2 - raioMin ** 2));
        const angulo = rng() * Math.PI * 2;
        const candidato = {
          x: distancia * Math.cos(angulo),
          z: distancia * Math.sin(angulo),
          r: tamanho.r,
          ...tamanho,
          giro: rng() * Math.PI * 2,
        };

        const dentroDoChao = distancia + candidato.r <= raioDiorama - FOLGA_BORDA;
        const livre = ocupados.every(
          (o) => Math.hypot(o.x - candidato.x, o.z - candidato.z) >= o.r + candidato.r + FOLGA_ENTRE
        );
        if (dentroDoChao && livre) {
          ocupados.push(candidato);
          colocados.push(candidato);
          break;
        }
      }
    }
    return colocados;
  }


  const arvores = sortear(4, 2.6, 3.8, (rng) => {
    const escala = 0.8 + rng() * 0.3;
    return { escala, r: 1.05 * escala };  
  });
  const pedras = sortear(5, 1.9, 4.4, (rng) => {
    const escala = 0.4 + rng() * 0.5;
    return { escala, r: 1.2 * escala };   
  });
  const tufos = sortear(18, 1.3, 4.6, (rng) => {
    const escala = 0.8 + rng() * 0.6;
    return { escala, r: 0.3 * escala };
  });

  return { arvores, pedras, tufos };
}

export function criarCenario(gl, raioDiorama, carregarTextura) {
  const layout = sortearLayout(raioDiorama, 2024);

  const texturas = {
    casca: carregarTextura(gl, "assets/casca.png"),
    folhas: carregarTextura(gl, "assets/folhas.png"),
    pedra: carregarTextura(gl, "assets/pedra.png"),
    mato: carregarTextura(gl, "assets/mato.png", gl.CLAMP_TO_EDGE),
  };

  const malhaTronco = criarMalhaTronco(gl);
  const malhasCopa = [criarMalhaCopa(gl, 1), criarMalhaCopa(gl, 2)];
  const malhasPedra = [1, 2, 3].map((semente) => criarMalhaPedra(gl, 1, semente));
  const malhasTufo = [1, 2, 3].map((semente) => criarMalhaTufo(gl, semente));

  const materialTronco = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.03, 0.03, 0.03], brilho: 4 };
  const materialCopa = { ka: [0.6, 0.6, 0.6], kd: [0.9, 0.9, 0.9], ks: [0.05, 0.05, 0.05], brilho: 6 };
  const materialMato = { ka: [0.65, 0.65, 0.65], kd: [0.95, 0.95, 0.95], ks: [0.1, 0.1, 0.1], brilho: 16 };
  const materiaisPedra = [
    { ka: [0.6, 0.6, 0.6], kd: [0.88, 0.95, 1.0], ks: [0.08, 0.08, 0.08], brilho: 12 },
    { ka: [0.6, 0.6, 0.6], kd: [1.0, 0.94, 0.86], ks: [0.08, 0.08, 0.08], brilho: 12 },
  ];

  const objetos = [];

  layout.arvores.forEach((p, i) => {
    let posicionar = m4.translation([p.x, 0, p.z]);
    posicionar = m4.multiply(posicionar, m4.rotationY(p.giro));
    posicionar = m4.multiply(posicionar, m4.scaling([p.escala, p.escala, p.escala]));

    const copa = {
      nome: "copa",
      malha: malhasCopa[i % malhasCopa.length],
      material: materialCopa,
      textura: texturas.folhas,
      repeticao: 2,
      modelo: m4.translation([0, ALTURA_TRONCO + 0.45, 0]),
      filhos: [],
    };
    objetos.push({
      nome: "árvore",
      malha: malhaTronco,
      material: materialTronco,
      textura: texturas.casca,
      repeticao: 1,
      modelo: posicionar,
      filhos: [copa],
    });
  });

  layout.pedras.forEach((p, i) => {
    let modelo = m4.translation([p.x, 0, p.z]);
    modelo = m4.multiply(modelo, m4.rotationY(p.giro));
    modelo = m4.multiply(modelo, m4.scaling([p.escala, p.escala, p.escala]));
    objetos.push({
      nome: "pedra",
      malha: malhasPedra[i % malhasPedra.length],
      material: materiaisPedra[i % materiaisPedra.length],
      textura: texturas.pedra,
      repeticao: 1,
      modelo,
      filhos: [],
    });
  });

  layout.tufos.forEach((p, i) => {
    let modelo = m4.translation([p.x, 0, p.z]);
    modelo = m4.multiply(modelo, m4.rotationY(p.giro));
    modelo = m4.multiply(modelo, m4.scaling([p.escala, p.escala, p.escala]));
    objetos.push({
      nome: "mato",
      malha: malhasTufo[i % malhasTufo.length],
      material: materialMato,
      textura: texturas.mato,
      repeticao: 1,
      modelo,
      filhos: [],
    });
  });

  return objetos;
}
