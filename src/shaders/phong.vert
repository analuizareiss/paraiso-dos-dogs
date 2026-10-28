#version 300 es

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_projecao;
uniform mat4 u_visao;
uniform mat4 u_modelo;
uniform mat4 u_matrizNormal; 
out vec3 v_normal;
out vec3 v_posicaoMundo;
out vec2 v_texcoord;

void main() {
  vec4 posMundo = u_modelo * a_position;

  v_posicaoMundo = posMundo.xyz;
  v_normal = mat3(u_matrizNormal) * a_normal;
  v_texcoord = a_texcoord;

  gl_Position = u_projecao * u_visao * posMundo;
}
