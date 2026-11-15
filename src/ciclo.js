import { CONFIG } from "./config.js";

// Pontos do dia. Entre dois pontos, as cores são misturadas em linha reta.
const PONTOS = [
  { hora: 0, fundo: [0.02, 0.03, 0.08], luz: [0.34, 0.42, 0.75], ambiente: [0.11, 0.12, 0.24] }, // noite
  { hora: 5, fundo: [0.05, 0.06, 0.14], luz: [0.34, 0.42, 0.75], ambiente: [0.11, 0.12, 0.24] }, // madrugada
  { hora: 5.75, fundo: [0.38, 0.24, 0.40], luz: [0.55, 0.40, 0.55], ambiente: [0.20, 0.17, 0.28] }, // antes do sol
  { hora: 6.5, fundo: [0.95, 0.58, 0.38], luz: [1.00, 0.65, 0.40], ambiente: [0.36, 0.28, 0.30] }, // amanhecer
  { hora: 8, fundo: [0.62, 0.76, 0.93], luz: [1.00, 0.90, 0.75], ambiente: [0.25, 0.26, 0.32] }, // manhã
  { hora: 12, fundo: [0.45, 0.70, 0.95], luz: [1.00, 0.97, 0.90], ambiente: [0.28, 0.28, 0.34] }, // meio-dia
  { hora: 16, fundo: [0.55, 0.75, 0.92], luz: [1.00, 0.92, 0.78], ambiente: [0.26, 0.26, 0.32] }, // tarde
  { hora: 17.5, fundo: [0.95, 0.62, 0.40], luz: [1.00, 0.65, 0.35], ambiente: [0.34, 0.27, 0.28] }, // fim de tarde
  { hora: 18.25, fundo: [0.85, 0.42, 0.30], luz: [1.00, 0.50, 0.30], ambiente: [0.32, 0.22, 0.26] }, // pôr do sol
  { hora: 19, fundo: [0.45, 0.24, 0.38], luz: [0.60, 0.40, 0.60], ambiente: [0.20, 0.16, 0.28] }, // depois do sol
  { hora: 20, fundo: [0.12, 0.10, 0.24], luz: [0.38, 0.42, 0.70], ambiente: [0.13, 0.13, 0.25] }, // crepúsculo
  { hora: 21.5, fundo: [0.03, 0.04, 0.10], luz: [0.34, 0.42, 0.75], ambiente: [0.11, 0.12, 0.24] }, // noite
  { hora: 24, fundo: [0.02, 0.03, 0.08], luz: [0.34, 0.42, 0.75], ambiente: [0.11, 0.12, 0.24] },
];

function misturar(a, b, t) {
  return a.map((valor, i) => valor + (b[i] - valor) * t);
}

// acha os dois pontos e mistura as cores deles.
function corNaHora(hora, campo) {
  for (let i = 0; i < PONTOS.length - 1; i++) {
    const antes = PONTOS[i];
    const depois = PONTOS[i + 1];
    if (hora >= antes.hora && hora <= depois.hora) {
      const t = (hora - antes.hora) / (depois.hora - antes.hora);
      return misturar(antes[campo], depois[campo], t);
    }
  }
  return PONTOS[0][campo];
}

// Devolve a direção para onde a luz vai
function direcaoDaLuz(hora) {
  const angulo = ((hora - 6) / 12) * Math.PI;
  const x = Math.cos(angulo);
  const y = Math.max(Math.abs(Math.sin(angulo)), 0.45);
  const z = 0.45;
  const tamanho = Math.hypot(x, y, z);
  return [-x / tamanho, -y / tamanho, -z / tamanho];
}

export function criarCicloDia() {
  const { duracaoDia, horaInicial, ativoAoIniciar } = CONFIG.cicloDia;

  let hora = horaInicial;
  let rodando = ativoAoIniciar;

  const estado = {
    hora,
    direcaoLuz: direcaoDaLuz(hora),
    corLuz: corNaHora(hora, "luz"),
    luzAmbiente: corNaHora(hora, "ambiente"),
    corFundo: corNaHora(hora, "fundo"),
  };

  function recalcular() {
    estado.hora = hora;
    estado.direcaoLuz = direcaoDaLuz(hora);
    estado.corLuz = corNaHora(hora, "luz");
    estado.luzAmbiente = corNaHora(hora, "ambiente");
    estado.corFundo = corNaHora(hora, "fundo");
  }

  // duracaoDia é quantos segundos de verdade dura um dia inteiro
  function atualizar(dt) {
    if (rodando) {
      hora = (hora + (dt * 24) / duracaoDia) % 24;
    }
    recalcular();
  }

  function alternar() {
    rodando = !rodando;
    return rodando;
  }

  function descricao() {
    const horas = String(Math.floor(hora)).padStart(2, "0");
    const minutos = String(Math.floor((hora % 1) * 60)).padStart(2, "0");
    const icone = hora >= 6 && hora < 18 ? "☀️" : "🌙";
    return `${horas}:${minutos} ${icone}${rodando ? "" : " (pausado)"}`;
  }

  return { estado, atualizar, alternar, descricao };
}