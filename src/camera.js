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
    this.nome = "automática";
    this.alvo = alvo;
    this.distancia = 14;
    this.distanciaMin = 7;
    this.distanciaMax = 30;
    this.elevacao = 45 * GRAUS;
    this.angulo = 0;
    this.velocidade = 0.25; 
  }

  atualizar(dt) {
    this.angulo += this.velocidade * dt;
  }

  aoRolar(deltaY) {
    this.distancia = limitar(
      this.distancia + deltaY * 0.01,
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
    this.nome = "orbital";
    this.alvo = alvo;
    this.distancia = 14;
    this.elevacao = 30 * GRAUS;
    this.angulo = 45 * GRAUS;
    this.elevacaoMin = 5 * GRAUS;
    this.elevacaoMax = 85 * GRAUS; 
    this.sensibilidade = 0.005;   
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
