#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projecao;
uniform mat4 u_visao;
uniform mat4 u_modelo;
uniform mat4 u_matrizNormal;

out vec3 v_normal;
out vec3 v_posicaoMundo;

void main() {
  vec4 posMundo = u_modelo * a_position;

  v_posicaoMundo = posMundo.xyz;
  v_normal = mat3(u_matrizNormal) * a_normal;

  gl_Position = u_projecao * u_visao * posMundo;
}
