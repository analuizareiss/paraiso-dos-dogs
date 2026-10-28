#version 300 es
precision mediump float;

in vec3 v_normal;
in vec3 v_posicaoMundo;
in vec2 v_texcoord;

uniform vec3 u_dirLuz;
uniform vec3 u_corLuz;
uniform vec3 u_luzAmbiente;
uniform vec3 u_posCamera;

uniform vec3 u_ka;
uniform vec3 u_kd;
uniform vec3 u_ks;
uniform float u_brilho;

uniform sampler2D u_textura;
uniform float u_repeticao;

uniform bool u_iluminacao;

out vec4 o_cor;

void main() {
  vec3 albedo = texture(u_textura, v_texcoord * u_repeticao).rgb;

  if (!u_iluminacao) {
    o_cor = vec4(albedo, 1.0);
    return;
  }

  vec3 n = normalize(v_normal);
  vec3 l = normalize(-u_dirLuz);
  vec3 v = normalize(u_posCamera - v_posicaoMundo);
  vec3 h = normalize(l + v);

  float dif = max(dot(n, l), 0.0);
  float esp = 0.0;
  if (dif > 0.0) {
    esp = pow(max(dot(n, h), 0.0), u_brilho);
  }

  vec3 cor = u_ka * u_luzAmbiente * albedo
           + u_kd * u_corLuz * dif * albedo
           + u_ks * u_corLuz * esp;

  o_cor = vec4(cor, 1.0);
}
