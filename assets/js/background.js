/* ==========================================================================
   Ambient background — a slow, low-contrast aurora in a tiny WebGL shader.
   Renders at reduced resolution, caps at ~30 fps, pauses when the tab is hidden.
   Falls back to the CSS gradient on the canvas if WebGL is unavailable.
   ========================================================================== */
(() => {
  "use strict";
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return;

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `
    precision mediump float;
    uniform vec2 r; uniform float t; uniform float s;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n(p); p *= 2.02; a *= 0.5; } return v; }
    void main(){
      vec2 uv = gl_FragCoord.xy / r;
      vec2 p = uv; p.x *= r.x / r.y;
      p.y += s * 0.00025;
      float q = fbm(p * 1.4 + vec2(t * 0.02, -t * 0.015));
      float w = fbm(p * 2.2 + q * 1.6 + vec2(-t * 0.018, t * 0.01));
      vec3 bg = vec3(0.039, 0.043, 0.055);
      vec3 blue = vec3(0.663, 0.745, 1.0);
      vec3 gold = vec3(0.89, 0.773, 0.549);
      float band = smoothstep(0.45, 0.95, w) * smoothstep(1.25, 0.2, uv.y + (1.0 - uv.x) * 0.35);
      float warm = smoothstep(0.55, 1.0, q) * smoothstep(0.7, 0.0, uv.y) * smoothstep(0.0, 0.6, 1.0 - uv.x);
      vec3 col = bg + blue * band * 0.085 + gold * warm * 0.035;
      float v = smoothstep(1.35, 0.25, length(uv - vec2(0.5, 0.55)));
      col *= mix(0.7, 1.0, v);
      gl_FragColor = vec4(col, 1.0);
    }`;

  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uS = gl.getUniformLocation(prog, "s");

  const SCALE = 0.5;
  const resize = () => {
    canvas.width = Math.max(1, Math.round(window.innerWidth * SCALE));
    canvas.height = Math.max(1, Math.round(window.innerHeight * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize);

  const t0 = performance.now();
  let last = 0, raf = 0;
  const draw = (now) => {
    gl.uniform1f(uT, reduced ? 12.0 : (now - t0) / 1000);
    gl.uniform1f(uS, window.scrollY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now; draw(now);
  };
  if (reduced) {
    draw(performance.now());
    window.addEventListener("scroll", () => draw(performance.now()), { passive: true });
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  }
})();
