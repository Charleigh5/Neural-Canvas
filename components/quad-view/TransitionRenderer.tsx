import React, { useEffect, useRef } from 'react';
import { resolveAssetUrl } from '../../utils/assetUtils';
import { loadAsset } from '../../hooks/useImage';
import { ImageAsset } from '../../types';

interface TransitionRendererProps {
  prevAsset: ImageAsset | undefined;
  currAsset: ImageAsset;
  progress: number;
  type?:
    | 'fade'
    | 'slide'
    | 'cut'
    | 'dissolve'
    | 'liquid'
    | 'glitch'
    | 'pixelate'
    | 'swirl'
    | 'flash'
    | 'zoom-blur'
    | 'kaleido';
  kenBurns?: { start: number; end: number };
  currFocalPoint?: { x: number; y: number };
  prevFocalPoint?: { x: number; y: number };
  duration?: number;
}

export const TransitionRenderer: React.FC<TransitionRendererProps> = ({
  prevAsset,
  currAsset,
  progress,
  type = 'dissolve',
  kenBurns = { start: 1.0, end: 1.15 },
  currFocalPoint = { x: 0.5, y: 0.5 },
  prevFocalPoint = { x: 0.5, y: 0.5 },
  duration = 5.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  // Store texture references
  const texturesRef = useRef<{ t1: WebGLTexture | null; t2: WebGLTexture | null }>({
    t1: null,
    t2: null,
  });
  // Store active video/image elements to update textures frame-by-frame
  const sourcesRef = useRef<{
    s1: HTMLImageElement | HTMLVideoElement | ImageBitmap | null;
    s2: HTMLImageElement | HTMLVideoElement | ImageBitmap | null;
  }>({ s1: null, s2: null });

  const timeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Determine active transition type: Prefer asset-specific, fallback to theme/prop
  const activeType = currAsset.transition ?? type;

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const createShader = (gl: WebGLRenderingContext, shaderType: number, source: string) => {
      const shader = gl.createShader(shaderType);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = position * 0.5 + 0.5;
        v_texCoord.y = 1.0 - v_texCoord.y; 
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const getFragSource = (t: string) => {
      const header = `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_tex1;
            uniform sampler2D u_tex2;
            uniform float u_progress;
            uniform float u_zoom1;
            uniform float u_zoom2;
            uniform vec2 u_center1;
            uniform vec2 u_center2;
            
            float rand(vec2 co) {
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }
            
            vec2 getUV(vec2 uv, float zoom, vec2 center) {
                return (uv - center) / zoom + center;
            }
        `;

      if (t === 'liquid') {
        return `${header}
            void main() {
                vec2 uv = v_texCoord;
                float delay = uv.y * 0.2;
                float p = clamp((u_progress - delay) / 0.8, 0.0, 1.0);
                float distortion = sin(uv.y * 10.0 + u_progress * 5.0) * 0.02 * (1.0 - p) * p;
                vec2 distUV = uv + vec2(distortion, 0.0);
                vec2 uv1 = getUV(distUV, u_zoom1, u_center1);
                vec2 uv2 = getUV(distUV, u_zoom2, u_center2);
                vec4 col1 = texture2D(u_tex1, uv1);
                vec4 col2 = texture2D(u_tex2, uv2);
                gl_FragColor = mix(col1, col2, p);
            }`;
      }
      if (t === 'glitch') {
        return `${header}
            void main() {
                vec2 uv = v_texCoord;
                float p = u_progress;
                float noise = rand(vec2(floor(uv.y * 20.0), p));
                vec2 uv1 = getUV(uv, u_zoom1, u_center1);
                vec2 uv2 = getUV(uv, u_zoom2, u_center2);
                if (noise > 0.9 && p > 0.1 && p < 0.9) {
                   uv1.x += (rand(vec2(p)) - 0.5) * 0.1;
                   uv2.x += (rand(vec2(p)) - 0.5) * 0.1;
                }
                float r = rand(uv);
                if (r > p) gl_FragColor = texture2D(u_tex1, uv1);
                else gl_FragColor = texture2D(u_tex2, uv2);
            }`;
      }
      if (t === 'pixelate') {
        return `${header}
            void main() {
                float p = u_progress;
                float squares = mix(1000.0, 15.0, sin(p * 3.14159)); 
                vec2 p_uv = floor(v_texCoord * squares) / squares;
                vec2 uv1 = getUV(p_uv, u_zoom1, u_center1);
                vec2 uv2 = getUV(p_uv, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                gl_FragColor = mix(c1, c2, p);
            }`;
      }
      if (t === 'swirl') {
        return `${header}
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
                vec2 uv1 = getUV(tc, u_zoom1, u_center1);
                vec2 uv2 = getUV(tc, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                gl_FragColor = mix(c1, c2, p);
            }`;
      }
      if (t === 'flash') {
        return `${header}
            void main() {
                float p = u_progress;
                vec2 uv1 = getUV(v_texCoord, u_zoom1, u_center1);
                vec2 uv2 = getUV(v_texCoord, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                vec4 tex = mix(c1, c2, step(0.5, p));
                float intensity = sin(p * 3.14159);
                gl_FragColor = mix(tex, vec4(1.0), intensity * 0.9);
            }`;
      }
      if (t === 'fade') {
        return `${header}
            void main() {
                vec2 uv1 = getUV(v_texCoord, u_zoom1, u_center1);
                vec2 uv2 = getUV(v_texCoord, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                gl_FragColor = mix(c1, c2, u_progress);
            }`;
      }
      if (t === 'slide') {
        return `${header}
            void main() {
                float p = u_progress;
                vec2 offset = vec2(p, 0.0);
                vec2 uv1 = getUV(v_texCoord + offset, u_zoom1, u_center1);
                vec2 uv2 = getUV(v_texCoord - (1.0 - offset), u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                float edge = step(1.0 - p, v_texCoord.x);
                gl_FragColor = mix(c1, c2, edge);
            }`;
      }
      if (t === 'cut') {
        return `${header}
            void main() {
                vec2 uv1 = getUV(v_texCoord, u_zoom1, u_center1);
                vec2 uv2 = getUV(v_texCoord, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                gl_FragColor = u_progress > 0.5 ? c2 : c1;
            }`;
      }
      if (t === 'zoom-blur') {
        return `${header}
            void main() {
                float p = u_progress;
                vec2 center = vec2(0.5, 0.5);
                vec2 dir = v_texCoord - center;
                float strength = sin(p * 3.14159) * 0.1;
                vec4 color = vec4(0.0);
                for (int i = 0; i < 8; i++) {
                    float t = float(i) / 8.0;
                    vec2 offset = dir * strength * t;
                    vec2 uv1 = getUV(v_texCoord - offset, u_zoom1, u_center1);
                    vec2 uv2 = getUV(v_texCoord - offset, u_zoom2, u_center2);
                    color += mix(texture2D(u_tex1, uv1), texture2D(u_tex2, uv2), p);
                }
                gl_FragColor = color / 8.0;
            }`;
      }
      if (t === 'kaleido') {
        return `${header}
            void main() {
                float p = u_progress;
                vec2 center = vec2(0.5, 0.5);
                vec2 tc = v_texCoord - center;
                float angle = atan(tc.y, tc.x);
                float radius = length(tc);
                float segments = 6.0 + sin(p * 3.14159) * 4.0;
                angle = mod(angle, 3.14159 * 2.0 / segments);
                angle = abs(angle - 3.14159 / segments);
                vec2 uv = center + vec2(cos(angle), sin(angle)) * radius;
                vec2 uv1 = getUV(uv, u_zoom1, u_center1);
                vec2 uv2 = getUV(uv, u_zoom2, u_center2);
                vec4 c1 = texture2D(u_tex1, uv1);
                vec4 c2 = texture2D(u_tex2, uv2);
                gl_FragColor = mix(c1, c2, p);
            }`;
      }
      // Fallback Dissolve
      return `${header}
        void main() {
            vec2 uv1 = getUV(v_texCoord, u_zoom1, u_center1);
            vec2 uv2 = getUV(v_texCoord, u_zoom2, u_center2);
            float r = rand(v_texCoord);
            if (r > u_progress) gl_FragColor = texture2D(u_tex1, uv1);
            else gl_FragColor = texture2D(u_tex2, uv2);
        }`;
    };

    const program = gl.createProgram();
    if (!program) return;
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, getFragSource(activeType));
    if (!vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [activeType]);

  // Asset Loading Engine
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const loadSource = async (asset: ImageAsset) => {
      if (asset.mediaType === 'video') {
        const url = await resolveAssetUrl(asset.url);
        if (!url) return null;
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.src = url;
        await vid.play().catch(e => console.error('Video play fail', e));
        return vid;
      } else {
        // Use the shared asset loader to benefit from cached ImageBitmaps
        try {
          return await loadAsset(asset.url);
        } catch (e) {
          console.error('Failed to load asset for transition', e);
          return null;
        }
      }
    };

    const setupTexture = (source: HTMLImageElement | HTMLVideoElement | ImageBitmap) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // ImageBitmap, HTMLVideoElement, and HTMLImageElement are all valid TexImageSource
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
      return tex;
    };

    const initScenes = async () => {
      // Cleanup old sources
      if (sourcesRef.current.s1 instanceof HTMLVideoElement) {
        sourcesRef.current.s1.pause();
        sourcesRef.current.s1.src = '';
      }
      if (sourcesRef.current.s2 instanceof HTMLVideoElement) {
        sourcesRef.current.s2.pause();
        sourcesRef.current.s2.src = '';
      }

      if (prevAsset) {
        const s1 = await loadSource(prevAsset);
        if (s1) {
          sourcesRef.current.s1 = s1;
          texturesRef.current.t1 = setupTexture(s1);
        }
      }

      if (currAsset) {
        const s2 = await loadSource(currAsset);
        if (s2) {
          sourcesRef.current.s2 = s2;
          texturesRef.current.t2 = setupTexture(s2);
        }
      }
      timeRef.current = 0;
    };

    initScenes();
  }, [prevAsset, currAsset]);

  // Render Loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    let startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const dt = (now - startTime) / 1000;
      timeRef.current += dt;
      startTime = now;

      gl.useProgram(program);

      // Update Video Textures Frame-by-Frame
      if (sourcesRef.current.s1 instanceof HTMLVideoElement && texturesRef.current.t1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.t1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourcesRef.current.s1);
      }
      if (sourcesRef.current.s2 instanceof HTMLVideoElement && texturesRef.current.t2) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.t2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourcesRef.current.s2);
      }

      // Uniforms
      const progressTime = Math.min(timeRef.current / duration, 1.0);
      const zoomCurr = kenBurns.start + (kenBurns.end - kenBurns.start) * progressTime;
      const zoomPrev = kenBurns.end;

      gl.uniform1f(gl.getUniformLocation(program, 'u_progress'), progress);
      gl.uniform1f(gl.getUniformLocation(program, 'u_zoom1'), zoomPrev);
      gl.uniform1f(gl.getUniformLocation(program, 'u_zoom2'), zoomCurr);

      gl.uniform2f(gl.getUniformLocation(program, 'u_center1'), prevFocalPoint.x, prevFocalPoint.y);
      gl.uniform2f(gl.getUniformLocation(program, 'u_center2'), currFocalPoint.x, currFocalPoint.y);

      // Bind Textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.t1);
      gl.uniform1i(gl.getUniformLocation(program, 'u_tex1'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.t2);
      gl.uniform1i(gl.getUniformLocation(program, 'u_tex2'), 1);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, [progress, kenBurns, currFocalPoint, prevFocalPoint, duration, activeType]);

  return (
    <canvas ref={canvasRef} width={1920} height={1080} className="w-full h-full object-cover" />
  );
};
