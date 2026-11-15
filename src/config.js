export const CONFIG = {
  diorama: {
    raio: 5,
    centro: [0, 0, 0],
  },

  // as cores do céu e da luz vêm do ciclo dia/noite
  cicloDia: {
    ativoAoIniciar: true,
    duracaoDia: 90,
    horaInicial: 9,
  },

  neblina: {
    ativaAoIniciar: false,
    inicio: 6, // até esta distância da câmera não há neblina
    fim: 20,   // a partir desta distância tudo tem a cor do fundo
  },

  camera: {
    fov: 45,
    near: 0.1,
    far: 100,

    automatica: {
      distancia: 14,
      distanciaMin: 7,
      distanciaMax: 30,
      elevacao: 45,
      velocidade: 0.25,     
      zoomPorRolagem: 0.01,  
    },

    orbital: {
      distancia: 14,
      elevacao: 30,
      angulo: 45,
      elevacaoMin: 5,
      elevacaoMax: 85,       
      sensibilidade: 0.005, 
    },
  },


  cenario: {
    semente: 2024,
    folgaBorda: 0.15,
    folgaEntre: 0.1, 
    arvores: { quantidade: 4, raioMin: 2.6, raioMax: 3.8 },
    pedras: { quantidade: 5, raioMin: 1.9, raioMax: 4.4 },
    tufos: { quantidade: 18, raioMin: 1.3, raioMax: 4.6 },
  },

  reservas: {
    centro: { x: 0, z: 0, r: 1.8 },                // cachorro em pé e dormindo
    cachorroNaBorda: { x: 4.15, z: 0.37, r: 0.7 }, // pose 2 do cachorro
  },

  // r é o espaço que o moinho ocupa no chão, contando as pás
  moinho: {
    x: 2.6,
    z: -1.6,
    r: 1.45,
    velocidade: 0.8, 
  },

  som: {
    arquivo: "assets/ambiente.mp3",
    volume: 0.5,
  },
};
