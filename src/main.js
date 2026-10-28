import * as twgl from "./twgl.js";
import { CameraAutomatica, CameraOrbital } from "./camera.js";
import { criarCenario } from "./cenario.js";

const m4 = twgl.m4;

twgl.setDefaults({ attribPrefix: "a_" });

const RAIO_DIORAMA = 5;
const CENTRO_DIORAMA = [0, 0, 0];

const cameras = {
  1: new CameraAutomatica(CENTRO_DIORAMA),
  2: new CameraOrbital(CENTRO_DIORAMA),
};

const estado = {
  iluminacao: true,
  camera: cameras[1],
};

const luz = {
  direcao: [-0.5, -1.0, -0.6],
  cor: [1.0, 0.95, 0.85],
  ambiente: [0.25, 0.25, 0.3],
};

function mostrarStatus(texto) {
  document.querySelector("#status").textContent = texto;
}

function atualizarPainel(camera) {
  const graus = (rad) => (rad * 180 / Math.PI).toFixed(0);
  document.querySelector("#hud").textContent =
    `câmera: ${camera.nome}\n` +
    `distância: ${camera.distancia.toFixed(1)}\n` +
    `elevação: ${graus(camera.elevacao)}º`;
}

async function carregarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}`);
  return resposta.text();
}

function configurarTeclado() {
  window.addEventListener("keydown", (e) => {
    const tecla = e.key.toLowerCase();
    if (tecla === "l") {
      estado.iluminacao = !estado.iluminacao;
    } else if (tecla === "1" || tecla === "2") {
      estado.camera = cameras[tecla];
    }
  });
}

function configurarMouse(canvas) {
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (!estado.camera.aoRolar) return;
    const deltaY = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
    estado.camera.aoRolar(deltaY);
  }, { passive: false });

  let arrastando = false;
  canvas.addEventListener("pointerdown", (e) => {
    arrastando = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!arrastando || !estado.camera.aoArrastar) return;
    estado.camera.aoArrastar(e.movementX, e.movementY);
  });
  const soltar = () => { arrastando = false; };
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);
}

function carregarTextura(gl, caminho, wrap = gl.REPEAT) {
  return twgl.createTexture(gl, {
    src: caminho,
    min: gl.LINEAR_MIPMAP_LINEAR,
    mag: gl.LINEAR,
    wrap,
  });
}


function criarDisco(gl, raio, divisoes) {
  const vertices = twgl.primitives.createDiscVertices(raio, divisoes);
  const posicao = vertices.position;
  const texcoord = vertices.texcoord;
  for (let i = 0; i < posicao.length / 3; i++) {
    texcoord[i * 2] = posicao[i * 3] / (2 * raio) + 0.5;        
    texcoord[i * 2 + 1] = posicao[i * 3 + 2] / (2 * raio) + 0.5; 
  }
  return twgl.createBufferInfoFromArrays(gl, vertices);
}


function criarCena(gl) {
  const chao = {
    nome: "chão",
    malha: criarDisco(gl, RAIO_DIORAMA, 64),
    material: {
      ka: [0.6, 0.6, 0.6],
      kd: [0.9, 0.9, 0.9],
      ks: [0.04, 0.04, 0.04],
      brilho: 4,
    },
    textura: carregarTextura(gl, "assets/grama.avif"),
    repeticao: 4,
    modelo: m4.identity(),
  };

  const base = {
    nome: "hemisfério",
    malha: twgl.primitives.createSphereBufferInfo(
      gl, RAIO_DIORAMA, 64, 24, Math.PI / 2, Math.PI
    ),
    material: {
      ka: [0.6, 0.6, 0.6],
      kd: [0.9, 0.9, 0.9],
      ks: [0.7, 0.7, 0.7],
      brilho: 60,
    },
    textura: carregarTextura(gl, "assets/casco.png"),
    repeticao: 4,
    modelo: m4.identity(),
  };

  return [chao, base, ...criarCenario(gl, RAIO_DIORAMA, carregarTextura)];
}

async function main() {
  const canvas = document.querySelector("#tela");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    mostrarStatus("Seu navegador não suporta WebGL2.");
    return;
  }

  const [fonteVert, fonteFrag] = await Promise.all([
    carregarTexto("src/shaders/phong.vert"),
    carregarTexto("src/shaders/phong.frag"),
  ]);
  const programa = twgl.createProgramInfo(gl, [fonteVert, fonteFrag], (msg) => {
    throw new Error("Shader: " + msg);
  });

  const objetos = criarCena(gl);
  configurarTeclado();
  configurarMouse(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.06, 0.08, 0.11, 1);


  function desenharObjeto(objeto, matrizPai) {
    const matrizMundo = m4.multiply(matrizPai, objeto.modelo);

    if (objeto.malha) {
      const matrizNormal = m4.transpose(m4.inverse(matrizMundo));
      const material = objeto.material;

      twgl.setBuffersAndAttributes(gl, programa, objeto.malha);
      twgl.setUniforms(programa, {
        u_modelo: matrizMundo,
        u_matrizNormal: matrizNormal,
        u_ka: material.ka,
        u_kd: material.kd,
        u_ks: material.ks,
        u_brilho: material.brilho,
        u_textura: objeto.textura,
        u_repeticao: objeto.repeticao,
      });
      twgl.drawBufferInfo(gl, objeto.malha);
    }

    for (const filho of objeto.filhos ?? []) {
      desenharObjeto(filho, matrizMundo);
    }
  }

  let tempoAnterior = null;

  function desenhar(tempo) {
    tempo *= 0.001; 
    const dt = tempoAnterior === null ? 0 : tempo - tempoAnterior;
    tempoAnterior = tempo;

    const camera = estado.camera;
    camera.atualizar?.(dt);
    atualizarPainel(camera);

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspecto = canvas.clientWidth / canvas.clientHeight;
    const projecao = m4.perspective((45 * Math.PI) / 180, aspecto, 0.1, 100);
    const posCamera = camera.posicao();
    const visao = m4.inverse(m4.lookAt(posCamera, camera.alvo, [0, 1, 0]));

    gl.useProgram(programa.program);

    const uniformesDaCena = {
      u_projecao: projecao,
      u_visao: visao,
      u_dirLuz: luz.direcao,
      u_corLuz: luz.cor,
      u_luzAmbiente: luz.ambiente,
      u_posCamera: posCamera,
      u_iluminacao: estado.iluminacao,
    };

    twgl.setUniforms(programa, uniformesDaCena);
    for (const objeto of objetos) {
      desenharObjeto(objeto, m4.identity());
    }

    requestAnimationFrame(desenhar);
  }

  requestAnimationFrame(desenhar);
}

main().catch((erro) => {
  console.error(erro);
  mostrarStatus("ERRO: " + erro.message);
});
