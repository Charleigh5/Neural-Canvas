
/**
 * SHADERS.TS
 * High-performance GLSL strings for WebGL transitions.
 */

export const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = position * 0.5 + 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y; // Flip Y for typical texture coords
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const NEURAL_DISSOLVE_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;
  
  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    float r = rand(v_texCoord);
    if (r > u_progress) {
      gl_FragColor = texture2D(u_tex1, v_texCoord);
    } else {
      gl_FragColor = texture2D(u_tex2, v_texCoord);
    }
  }
`;

export const LIQUID_WIPE_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;

  void main() {
    vec2 uv = v_texCoord;
    float delay = uv.y * 0.2;
    float p = clamp((u_progress - delay) / 0.8, 0.0, 1.0);
    
    // Distort edge
    float distortion = sin(uv.y * 10.0 + u_progress * 5.0) * 0.02 * (1.0 - p) * p;
    vec2 distortedUV = uv + vec2(distortion, 0.0);

    vec4 col1 = texture2D(u_tex1, distortedUV);
    vec4 col2 = texture2D(u_tex2, distortedUV);
    
    gl_FragColor = mix(col1, col2, p);
  }
`;

export const GLITCH_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_texCoord;
    float p = u_progress;
    
    float noise = rand(vec2(floor(uv.y * 20.0), p));
    if (noise > 0.95 && p > 0.1 && p < 0.9) {
      uv.x += (rand(vec2(p)) - 0.5) * 0.1;
    }

    vec4 col1 = texture2D(u_tex1, uv);
    vec4 col2 = texture2D(u_tex2, uv);
    
    gl_FragColor = mix(col1, col2, p);
  }
`;

export const PIXELATE_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;
  
  void main() {
    float p = u_progress;
    // Calculate pixel size based on sine wave of progress
    float squares = mix(1000.0, 10.0, sin(p * 3.14159)); 
    vec2 p_uv = floor(v_texCoord * squares) / squares;
    
    vec4 c1 = texture2D(u_tex1, p_uv);
    vec4 c2 = texture2D(u_tex2, p_uv);
    
    gl_FragColor = mix(c1, c2, p);
  }
`;

export const SWIRL_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;
  
  void main() {
    float p = u_progress;
    float radius = 1.0;
    float angle = 10.0 * sin(p * 3.14159);
    
    vec2 center = vec2(0.5, 0.5);
    vec2 tc = v_texCoord - center;
    float dist = length(tc);
    
    if (dist < radius) {
        float percent = (radius - dist) / radius;
        float theta = percent * percent * angle;
        float s = sin(theta);
        float c = cos(theta);
        tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
    }
    tc += center;
    
    vec4 c1 = texture2D(u_tex1, tc);
    vec4 c2 = texture2D(u_tex2, tc);
    
    gl_FragColor = mix(c1, c2, p);
  }
`;

export const FLASH_FRAG = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_tex1;
  uniform sampler2D u_tex2;
  uniform float u_progress;
  
  void main() {
    float p = u_progress;
    
    vec4 c1 = texture2D(u_tex1, v_texCoord);
    vec4 c2 = texture2D(u_tex2, v_texCoord);
    
    // Switch texture at midpoint
    vec4 tex = mix(c1, c2, step(0.5, p));
    
    // Calculate intensity bloom
    float intensity = sin(p * 3.14159);
    
    // Mix towards white based on intensity
    gl_FragColor = mix(tex, vec4(1.0), intensity * 0.9);
  }
`;
