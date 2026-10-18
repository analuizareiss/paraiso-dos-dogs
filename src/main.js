import * as twgl from "https://cdnjs.cloudflare.com/ajax/libs/twgl.js/5.5.3/twgl-full.module.js";

const m4 = twgl.m4;

twgl.setDefaults({ attribPrefix: "a_" });

window.__iniciou = true;

function mostrarStatus(texto, erro = false) {
  const status = document.querySelector("#status");
  status.style.color = erro ? "#ff8a8a" : "#ffd166";
  status.textContent = texto;
}

const estado = {
  iluminacao: true,
};

const luz = {
  direcao: [-0.5, -1.0, -0.6],
  cor: [1.0, 0.95, 0.85],
  ambiente: [0.25, 0.25, 0.3],
};

const camera = {
  posicao: [4, 3, 6],
  alvo: [0, 0, 0],
  cima: [0, 1, 0],
};


// cubo de teste, só para validar o pipeline
const materialCubo = {
  ka: [0.4, 0.2, 0.2],
  kd: [0.8, 0.3, 0.3],
  ks: [0.9, 0.9, 0.9],
  brilho: 40,
};

async function carregarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}`);
  return resposta.text();
}

function configurarTeclado() {
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "l") {
      estado.iluminacao = !estado.iluminacao;
    }
  });
}

async function main() {
  const canvas = document.querySelector("#tela");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    document.body.textContent = "Seu navegador não suporta WebGL2.";
    return;
  }

  const [fonteVert, fonteFrag] = await Promise.all([
    carregarTexto("src/shaders/phong.vert"),
    carregarTexto("src/shaders/phong.frag"),
  ]);
  const programa = twgl.createProgramInfo(gl, [fonteVert, fonteFrag], (msg) => {
    throw new Error("Shader: " + msg);
  });

  const cubo = twgl.primitives.createCubeBufferInfo(gl, 2);

  configurarTeclado();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.06, 0.08, 0.11, 1);

  let tempoAnterior = 0;
  let anguloCubo = 0;

  function desenhar(tempo) {
    tempo *= 0.001;
    const dt = tempo - tempoAnterior;
    tempoAnterior = tempo;

    anguloCubo += dt * 0.8;

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspecto = canvas.clientWidth / canvas.clientHeight;
    const projecao = m4.perspective((45 * Math.PI) / 180, aspecto, 0.1, 100);
    const visao = m4.inverse(m4.lookAt(camera.posicao, camera.alvo, camera.cima));

    let modelo = m4.rotationY(anguloCubo);
    modelo = m4.rotateX(modelo, anguloCubo * 0.5);

    const matrizNormal = m4.transpose(m4.inverse(modelo));

    gl.useProgram(programa.program);
    twgl.setBuffersAndAttributes(gl, programa, cubo);
    twgl.setUniforms(programa, {
      u_projecao: projecao,
      u_visao: visao,
      u_modelo: modelo,
      u_matrizNormal: matrizNormal,
      u_dirLuz: luz.direcao,
      u_corLuz: luz.cor,
      u_luzAmbiente: luz.ambiente,
      u_posCamera: camera.posicao,
      u_ka: materialCubo.ka,
      u_kd: materialCubo.kd,
      u_ks: materialCubo.ks,
      u_brilho: materialCubo.brilho,
      u_iluminacao: estado.iluminacao,
    });
    twgl.drawBufferInfo(gl, cubo);

    mostrarStatus(
      `canvas ${canvas.width}x${canvas.height} | aspecto ${aspecto.toFixed(2)} | ` +
      `erro GL: ${gl.getError()} | iluminação: ${estado.iluminacao}`
    );
    requestAnimationFrame(desenhar);
  }

  requestAnimationFrame(desenhar);
}

main().catch((erro) => {
  console.error(erro);
  mostrarStatus("ERRO: " + erro.message, true);
});