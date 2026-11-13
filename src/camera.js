import { CONFIG } from "./config.js";

const GRAUS = Math.PI / 180;

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function posicaoEmVoltaDoAlvo(alvo, distancia, elevacao, angulo) {
  const horizontal = distancia * Math.cos(elevacao);
  return [
    alvo[0] + horizontal * Math.cos(angulo),
    alvo[1] + distancia * Math.sin(elevacao),
    alvo[2] + horizontal * Math.sin(angulo),
  ];
}

export class CameraAutomatica {
  constructor(alvo) {
    const c = CONFIG.camera.automatica;
    this.nome = "automática";
    this.alvo = alvo;
    this.distancia = c.distancia;
    this.distanciaMin = c.distanciaMin;
    this.distanciaMax = c.distanciaMax;
    this.elevacao = c.elevacao * GRAUS;
    this.angulo = 0;
    this.velocidade = c.velocidade;
    this.zoomPorRolagem = c.zoomPorRolagem;
  }

  atualizar(dt) {
    this.angulo += this.velocidade * dt;
  }

  aoRolar(deltaY) {
    this.distancia = limitar(
      this.distancia + deltaY * this.zoomPorRolagem,
      this.distanciaMin,
      this.distanciaMax
    );
  }

  posicao() {
    return posicaoEmVoltaDoAlvo(this.alvo, this.distancia, this.elevacao, this.angulo);
  }
}

export class CameraOrbital {
  constructor(alvo) {
    const c = CONFIG.camera.orbital;
    this.nome = "orbital";
    this.alvo = alvo;
    this.distancia = c.distancia;
    this.elevacao = c.elevacao * GRAUS;
    this.angulo = c.angulo * GRAUS;
    this.elevacaoMin = c.elevacaoMin * GRAUS;
    this.elevacaoMax = c.elevacaoMax * GRAUS;
    this.sensibilidade = c.sensibilidade;
  }

  aoArrastar(deltaX, deltaY) {
    this.angulo -= deltaX * this.sensibilidade;
    this.elevacao = limitar(
      this.elevacao + deltaY * this.sensibilidade,
      this.elevacaoMin,
      this.elevacaoMax
    );
  }

  posicao() {
    return posicaoEmVoltaDoAlvo(this.alvo, this.distancia, this.elevacao, this.angulo);
  }
}
