(() => {
  const canvas = document.querySelector(".darkveil-canvas");
  const hero = document.querySelector(".hero");

  if (!canvas || !hero) {
    return;
  }

  const gl =
    canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
    }) ||
    canvas.getContext("experimental-webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
    });

  if (!gl) {
    canvas.classList.add("is-static");
    return;
  }

  const maxColors = 8;
  const settings = {
    rotation: -101,
    autoRotate: -1.8,
    speed: 0.26,
    colors: ["#ff6814", "#c84c20", "#7a2b12", "#35140a"],
    scale: 2.95,
    frequency: 1.72,
    warpStrength: 0.92,
    mouseInfluence: 0.34,
    parallax: 0.16,
    noise: 0.08,
    iterations: 3,
    intensity: 0.92,
    bandWidth: 3.65,
    resolutionScale: 0.92,
  };

  const vertex = `
attribute vec2 position;
varying vec2 vUv;
void main(){
  vUv=position*0.5+0.5;
  gl_Position=vec4(position,0.0,1.0);
}
`;

  const fragment = `
#ifdef GL_ES
precision mediump float;
#endif
#define MAX_COLORS 8
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

float rand(vec2 p){
  return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453123);
}

void main(){
  float t=uTime*uSpeed;
  vec2 p=vUv*2.0-1.0;
  p+=uPointer*uParallax*0.1;

  vec2 rp=vec2(p.x*uRot.x-p.y*uRot.y,p.x*uRot.y+p.y*uRot.x);
  vec2 q=vec2(rp.x*(uCanvas.x/uCanvas.y),rp.y);
  q/=max(uScale,0.0001);
  q/=0.5+0.2*dot(q,q);
  q+=0.2*cos(t)-7.56;
  q+=(uPointer-rp)*uMouseInfluence*0.2;

  for(int j=0;j<5;j++){
    if(j>=uIterations-1) break;
    vec2 rr=sin(1.5*(q.yx*uFrequency)+2.0*cos(q*uFrequency));
    q+=(rr-q)*0.15;
  }

  vec3 sumCol=vec3(0.0);
  float cover=0.0;
  vec2 s=q;

  for(int i=0;i<MAX_COLORS;i++){
    if(i>=uColorCount) break;
    s-=0.01;
    vec2 r=sin(1.5*(s.yx*uFrequency)+2.0*cos(s*uFrequency));
    float m0=length(r+sin(5.0*r.y*uFrequency-3.0*t+float(i))/4.0);
    float kBelow=clamp(uWarpStrength,0.0,1.0);
    float kMix=pow(kBelow,0.3);
    float gain=1.0+max(uWarpStrength-1.0,0.0);
    vec2 warped=s+(r-s)*kBelow*gain;
    float m1=length(warped+sin(5.0*warped.y*uFrequency-3.0*t+float(i))/4.0);
    float m=mix(m0,m1,kMix);
    float w=1.0-exp(-uBandWidth/exp(uBandWidth*m));
    sumCol+=uColors[i]*w;
    cover=max(cover,w);
  }

  vec2 uv=vUv*2.0-1.0;
  float center=exp(-dot(uv*vec2(0.78,1.08),uv*vec2(0.78,1.08))*1.08);
  float pointerGlow=exp(-dot((uv-uPointer)*vec2(1.55,1.55),(uv-uPointer)*vec2(1.55,1.55))*2.6);
  float vignette=smoothstep(1.52,0.22,length(uv*vec2(0.88,1.0)));

  vec3 ink=vec3(0.027,0.063,0.059);
  vec3 col=clamp(sumCol*uIntensity,0.0,1.0);
  col+=vec3(1.0,0.24,0.035)*center*0.08;
  col+=vec3(1.0,0.24,0.035)*pointerGlow*uMouseInfluence*0.045;
  col=mix(ink,col,clamp(cover*0.82+center*0.16,0.0,0.86));
  col=mix(ink,col,vignette);

  if(uNoise>0.0001){
    float n=rand(gl_FragCoord.xy+vec2(uTime));
    col+=(n-0.5)*uNoise;
  }

  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}
`;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
    }

    return shader;
  }

  function createProgram() {
    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
    }

    return program;
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "").trim();
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((part) => part + part)
            .join("")
        : normalized;

    return [
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255,
    ];
  }

  let program;

  try {
    program = createProgram();
  } catch (error) {
    console.warn(error);
    canvas.classList.add("is-static");
    return;
  }

  const uniforms = {
    canvas: gl.getUniformLocation(program, "uCanvas"),
    time: gl.getUniformLocation(program, "uTime"),
    speed: gl.getUniformLocation(program, "uSpeed"),
    rot: gl.getUniformLocation(program, "uRot"),
    colorCount: gl.getUniformLocation(program, "uColorCount"),
    colors: gl.getUniformLocation(program, "uColors[0]"),
    scale: gl.getUniformLocation(program, "uScale"),
    frequency: gl.getUniformLocation(program, "uFrequency"),
    warpStrength: gl.getUniformLocation(program, "uWarpStrength"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    mouseInfluence: gl.getUniformLocation(program, "uMouseInfluence"),
    parallax: gl.getUniformLocation(program, "uParallax"),
    noise: gl.getUniformLocation(program, "uNoise"),
    iterations: gl.getUniformLocation(program, "uIterations"),
    intensity: gl.getUniformLocation(program, "uIntensity"),
    bandWidth: gl.getUniformLocation(program, "uBandWidth"),
  };

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, "position");
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0.027, 0.063, 0.059, 1);

  const colorArray = new Float32Array(maxColors * 3);
  settings.colors.slice(0, maxColors).forEach((color, index) => {
    colorArray.set(hexToRgb(color), index * 3);
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let frame = 0;
  let start = performance.now();
  let pointerX = -0.08;
  let pointerY = 0.05;
  let targetPointerX = -0.08;
  let targetPointerY = 0.05;

  function updatePointer(event) {
    const rect = hero.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    targetPointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    targetPointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2) * settings.resolutionScale;
    const nextWidth = Math.max(1, Math.floor(rect.width * ratio));
    const nextHeight = Math.max(1, Math.floor(rect.height * ratio));

    if (nextWidth === width && nextHeight === height) {
      return;
    }

    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function render(now) {
    resize();

    const elapsed = (now - start) / 1000;
    const rotation = settings.rotation + settings.autoRotate * elapsed;
    const radians = (rotation * Math.PI) / 180;
    const pointerEase = reduceMotion.matches ? 1 : 0.08;

    pointerX += (targetPointerX - pointerX) * pointerEase;
    pointerY += (targetPointerY - pointerY) * pointerEase;

    gl.useProgram(program);
    gl.uniform2f(uniforms.canvas, width, height);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.speed, reduceMotion.matches ? 0 : settings.speed);
    gl.uniform2f(uniforms.rot, Math.cos(radians), Math.sin(radians));
    gl.uniform1i(uniforms.colorCount, Math.min(settings.colors.length, maxColors));
    gl.uniform3fv(uniforms.colors, colorArray);
    gl.uniform1f(uniforms.scale, settings.scale);
    gl.uniform1f(uniforms.frequency, settings.frequency);
    gl.uniform1f(uniforms.warpStrength, settings.warpStrength);
    gl.uniform2f(uniforms.pointer, pointerX, pointerY);
    gl.uniform1f(uniforms.mouseInfluence, settings.mouseInfluence);
    gl.uniform1f(uniforms.parallax, settings.parallax);
    gl.uniform1f(uniforms.noise, settings.noise);
    gl.uniform1i(uniforms.iterations, settings.iterations);
    gl.uniform1f(uniforms.intensity, settings.intensity);
    gl.uniform1f(uniforms.bandWidth, settings.bandWidth);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(render);
  }

  function startRender() {
    cancelAnimationFrame(frame);
    start = performance.now();
    render(start);

    if (reduceMotion.matches) {
      cancelAnimationFrame(frame);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", updatePointer, { passive: true });
  reduceMotion.addEventListener?.("change", startRender);
  startRender();
})();
