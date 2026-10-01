import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Mode } from './index';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SPEED = 1.5; // global animation speed multiplier
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
const easeOutBack = (x: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ------------------------------------------------------------------ */
/* Shared look: pastel holographic pearl (pink / lilac / periwinkle /  */
/* cyan), after the iridescent blob reference.                         */
/* ------------------------------------------------------------------ */

// Ashima / Stefan Gustavson 3D simplex noise (MIT)
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** Cyclic pastel holographic palette (sRGB stops, returned in linear). */
const HOLO = /* glsl */ `
vec3 holo(float x) {
  vec3 s0 = vec3(0.97, 0.94, 1.00); // pearl white-lilac
  vec3 s1 = vec3(1.00, 0.72, 0.92); // pink
  vec3 s2 = vec3(0.80, 0.72, 1.00); // lavender
  vec3 s3 = vec3(0.56, 0.72, 1.00); // periwinkle
  vec3 s4 = vec3(0.58, 0.93, 1.00); // cyan
  float f = fract(x) * 5.0;
  float k = smoothstep(0.0, 1.0, fract(f));
  vec3 c;
  if (f < 1.0) c = mix(s0, s1, k);
  else if (f < 2.0) c = mix(s1, s2, k);
  else if (f < 3.0) c = mix(s2, s3, k);
  else if (f < 4.0) c = mix(s3, s4, k);
  else c = mix(s4, s0, k);
  return pow(c, vec3(2.2));
}`;

/** Pastel pearly studio environment: this is what the glossy surfaces reflect. */
function buildEnvironment(renderer: THREE.WebGLRenderer) {
  const envScene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y + 0.1 * sin(atan(d.z, d.x) * 2.0);
        vec3 top    = vec3(0.98, 0.95, 1.00);
        vec3 pink   = vec3(1.00, 0.72, 0.90);
        vec3 lilac  = vec3(0.78, 0.72, 1.00);
        vec3 blue   = vec3(0.52, 0.70, 1.00);
        vec3 bottom = vec3(0.42, 0.40, 0.62);
        vec3 col = mix(bottom, blue, smoothstep(-0.7, -0.2, y));
        col = mix(col, lilac, smoothstep(-0.2, 0.1, y));
        col = mix(col, pink, smoothstep(0.05, 0.35, y));
        col = mix(col, top, smoothstep(0.35, 0.85, y));
        // cyan side light for the holographic sheen
        float side = smoothstep(0.5, 0.0, length(vec2(atan(d.x, d.z) + 1.9, d.y) * vec2(0.9, 1.4)));
        col = mix(col, vec3(0.55, 0.95, 1.0), side * 0.8);
        // softboxes
        float key = smoothstep(0.35, 0.0, length(vec2(atan(d.x, d.z) - 0.6, d.y - 0.45) * vec2(1.0, 2.2)));
        float rim = smoothstep(0.3, 0.0, length(vec2(atan(d.x, d.z) - 2.6, d.y - 0.1) * vec2(1.0, 1.6)));
        col += vec3(2.4) * key + vec3(1.3, 0.9, 1.4) * rim;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), mat));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();
  mat.dispose();
  return rt.texture;
}

type HoloOpts = {
  /** Extra GLSL (float) added to the palette lookup. Can use vHoloP (object-space position). */
  shift?: string;
  /** How strongly the viewing angle cycles the colour. */
  viewAmount?: number;
};

/**
 * Glossy pearl material whose base colour is a view-dependent holographic
 * palette + a slow marbled drift, on top of three's physical iridescence.
 */
function pearlMaterial(
  uTime: { value: number },
  params: Partial<THREE.MeshPhysicalMaterialParameters> = {},
  opts: HoloOpts = {},
) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.28,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    iridescence: 1,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [180, 620],
    sheen: 0.6,
    sheenColor: new THREE.Color('#ffc8f0'),
    sheenRoughness: 0.4,
    envMapIntensity: 1.2,
    ...params,
  });
  const view = (opts.viewAmount ?? 1).toFixed(3);
  const shift = opts.shift ?? '0.0';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHoloP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHoloP = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nvarying vec3 vHoloP;\n${SNOISE}\n${HOLO}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec3 hn = normalize(vNormal);
          vec3 hv = normalize(vViewPosition);
          float ndv = abs(dot(hn, hv));
          float drift = snoise(vHoloP * 0.9 + vec3(0.0, uTime * 0.06, 0.0));
          float x = (1.0 - ndv) * 0.9 * ${view} + hn.y * 0.22 - hn.x * 0.14 + drift * 0.22 + uTime * 0.02 + (${shift});
          diffuseColor.rgb *= holo(x);
        }`,
      );
  };
  mat.customProgramCacheKey = () => `pearl|${view}|${shift}`;
  return mat;
}

/* ------------------------------------------------------------------ */
/* Strategize -> folded pearl blob                                     */
/* ------------------------------------------------------------------ */

function createBlob(uTime: { value: number }) {
  const group = new THREE.Group();
  const material = pearlMaterial(uTime);
  const baseCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    baseCompile.call(material, shader, r);
    shader.vertexShader = shader.vertexShader
      .replace(
        'varying vec3 vHoloP;',
        /* glsl */ `varying vec3 vHoloP;
        uniform float uTime;
        ${SNOISE}
        vec3 displace(vec3 n) {
          float t = uTime * 0.16;
          float big = snoise(n * 0.9 + vec3(0.0, t, 0.0));
          vec3 w = vec3(snoise(n * 0.8 + vec3(0.0, 0.0, t)), snoise(n * 0.8 + vec3(5.2, 1.3, -t)), snoise(n * 0.8 + vec3(9.1, t, 2.7)));
          vec3 q = n * 1.2 + w * 0.55;
          float ridge = smoothstep(0.25, 1.0, 1.0 - abs(snoise(q + t * 0.6)));
          float lobes = snoise(q * 1.4 - t * 0.5);
          return n * (1.0 + 0.16 * big + 0.1 * ridge + 0.05 * lobes);
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 bn = normalize(position);
        vec3 bup = abs(bn.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 btg = normalize(cross(bn, bup));
        vec3 bbt = cross(bn, btg);
        vec3 blobP0 = displace(bn);
        vec3 bp1 = displace(normalize(bn + btg * 0.012));
        vec3 bp2 = displace(normalize(bn + bbt * 0.012));
        vec3 objectNormal = normalize(cross(bp1 - blobP0, bp2 - blobP0));`,
      )
      .replace('#include <begin_vertex>\nvHoloP = transformed;', 'vec3 transformed = blobP0;\nvHoloP = transformed;');
  };

  material.customProgramCacheKey = () => 'pearl-blob';
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), material);
  group.add(blob);

  return {
    group,
    update(t: number, presence: number) {
      const p = easeOutBack(presence);
      blob.scale.setScalar(Math.max(0.0001, p * 0.85));
      blob.rotation.y = t * 0.12 + (1 - presence) * 2;
      blob.rotation.x = Math.sin(t * 0.2) * 0.25;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Design -> twisted glass ribbon knot                                 */
/* A flat ribbon follows a trefoil knot; its twist flows over time.    */
/* ------------------------------------------------------------------ */

function createRibbon(uTime: { value: number }) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1, 720, 18); // uv.x = along the knot, uv.y = across the ribbon

  const material = pearlMaterial(
    uTime,
    {
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
      metalness: 0.2,
      roughness: 0.08,
      sheen: 0.3,
      envMapIntensity: 1.5,
    },
    { shift: 'vRib.x * 2.0', viewAmount: 1.3 },
  );
  const baseCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    baseCompile.call(material, shader, r);
    shader.vertexShader = shader.vertexShader
      .replace(
        'varying vec3 vHoloP;',
        /* glsl */ `varying vec3 vHoloP;
        varying vec2 vRib;
        uniform float uTime;
        const float TAU = 6.28318530718;
        vec3 knot(float s) {
          float ph = s * TAU;
          float R = 0.78, r = 0.36 + 0.04 * sin(ph * 3.0 + uTime * 0.4);
          vec3 radial = vec3(cos(2.0 * ph), sin(2.0 * ph), 0.0);
          return radial * R + r * (cos(3.0 * ph) * radial + sin(3.0 * ph) * vec3(0.0, 0.0, 1.0));
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        float s = uv.x;
        float across = uv.y - 0.5;
        float ph = s * TAU;
        vec3 P = knot(s);
        vec3 T = normalize(knot(s + 0.0008) - knot(s - 0.0008));
        vec3 radial = vec3(cos(2.0 * ph), sin(2.0 * ph), 0.0);
        vec3 N0 = normalize(P - radial * 0.78);
        vec3 B = normalize(cross(T, N0));
        vec3 N = cross(B, T);
        // twist: 3 half-turns around the loop, flowing with time (closes seamlessly)
        float a = ph * 3.0 * 0.5 + uTime * 0.35;
        vec3 W = cos(a) * N + sin(a) * B;
        float width = 0.34 + 0.1 * sin(ph * 3.0 + uTime * 0.3);
        vec3 ribbonP = P + W * across * width;
        vec3 objectNormal = normalize(cross(T, W));
        vRib = vec2(s, across);`,
      )
      .replace('#include <begin_vertex>\nvHoloP = transformed;', 'vec3 transformed = ribbonP;\nvHoloP = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('varying vec3 vHoloP;', 'varying vec3 vHoloP;\nvarying vec2 vRib;')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          // fine lengthwise striations, like brushed glass
          float str = sin(vRib.y * 140.0 + snoise(vec3(vRib.x * 18.0, vRib.y * 4.0, uTime * 0.1)) * 3.0);
          diffuseColor.rgb *= 0.9 + 0.1 * str;
          // brighter, more opaque toward the ribbon edges
          float edge = smoothstep(0.35, 0.5, abs(vRib.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), edge * 0.35);
          diffuseColor.a = mix(diffuseColor.a, 1.0, edge * 0.6);
        }`,
      );
  };

  material.customProgramCacheKey = () => 'pearl-ribbon';
  const ribbon = new THREE.Mesh(geo, material);
  ribbon.frustumCulled = false;
  group.add(ribbon);
  group.rotation.set(0.35, 0, 0.2);

  return {
    group,
    update(t: number, presence: number) {
      const p = easeOutBack(presence);
      ribbon.scale.setScalar(Math.max(0.0001, p * 1.05));
      ribbon.rotation.z = t * 0.15 + (1 - presence) * 2.2;
      ribbon.rotation.y = Math.sin(t * 0.25) * 0.35;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Build -> cube assembled from glass, matte and pearl pieces          */
/* ------------------------------------------------------------------ */

type Kind = 'glass' | 'white' | 'pink' | 'pearl' | 'empty';

function createBlocks(uTime: { value: number }) {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const N = 3;
  const cell = 0.5;
  const size = cell * 0.96;

  const cubeGeo = new RoundedBoxGeometry(size, size, size, 3, 0.018);
  const sphereGeo = new THREE.SphereGeometry(size * 0.5, 48, 32);
  const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size * 0.99, size * 0.99, size * 0.99));
  const insetGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size * 0.78, size * 0.78, size * 0.78));

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#8f86ff',
    metalness: 0.1,
    roughness: 0.04,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    clearcoat: 1,
    iridescence: 1,
    iridescenceIOR: 1.4,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: '#e8e2ff', transparent: true, opacity: 0.75 });
  const insetMat = new THREE.LineBasicMaterial({ color: '#b9a8ff', transparent: true, opacity: 0.45 });
  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: '#dfe7f6',
    roughness: 0.55,
    metalness: 0.05,
    sheen: 0.5,
    sheenColor: new THREE.Color('#cfe6ff'),
  });
  const pinkMat = new THREE.MeshPhysicalMaterial({
    color: '#f1c3e2',
    roughness: 0.5,
    metalness: 0.05,
    sheen: 0.6,
    sheenColor: new THREE.Color('#ffd6f1'),
  });
  const pearlMat = pearlMaterial(uTime, { metalness: 0.45, roughness: 0.22 });

  // Hand-placed pattern (x, y, z from -1..1) so the front corner reads like the reference.
  const pattern: Kind[] = [
    // y = -1 (bottom layer), z = -1..1 rows, x = -1..1 columns
    'glass', 'pink', 'pink',
    'pearl', 'glass', 'pink',
    'glass', 'white', 'glass',
    // y = 0
    'pink', 'pearl', 'pink',
    'white', 'empty', 'pearl',
    'white', 'glass', 'white',
    // y = 1 (top)
    'glass', 'pearl', 'white',
    'pearl', 'white', 'glass',
    'glass', 'white', 'glass',
  ];

  type Piece = { obj: THREE.Object3D; rest: THREE.Vector3; out: THREE.Vector3; delay: number; phase: number; slides: boolean };
  const pieces: Piece[] = [];
  let i = 0;
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      for (let x = -1; x <= 1; x++) {
        const kind = pattern[i++];
        if (kind === 'empty') continue;
        let obj: THREE.Object3D;
        if (kind === 'glass') {
          const g = new THREE.Group();
          const m = new THREE.Mesh(cubeGeo, glassMat);
          m.renderOrder = 2;
          g.add(m, new THREE.LineSegments(edgeGeo, edgeMat), new THREE.LineSegments(insetGeo, insetMat));
          obj = g;
        } else if (kind === 'pearl') {
          obj = new THREE.Mesh(sphereGeo, pearlMat);
          obj.scale.setScalar(1.08);
        } else {
          obj = new THREE.Mesh(cubeGeo, kind === 'white' ? whiteMat : pinkMat);
        }
        const rest = new THREE.Vector3(x, y, z).multiplyScalar(cell);
        // slide direction: the piece's most exposed axis
        const out = new THREE.Vector3(x, y, z);
        const ax = Math.abs(x) >= Math.abs(y) && Math.abs(x) >= Math.abs(z) ? 0 : Math.abs(y) >= Math.abs(z) ? 1 : 2;
        const dir = new THREE.Vector3();
        dir.setComponent(ax, Math.sign(out.getComponent(ax)) || 1);
        obj.position.copy(rest);
        inner.add(obj);
        const seed = (x + 2) * 7 + (y + 2) * 13 + (z + 2) * 29;
        pieces.push({
          obj,
          rest,
          out: dir,
          delay: ((seed * 37) % 100) / 100,
          phase: (seed * 1.7) % (Math.PI * 2),
          slides: (x !== 0 || y !== 0 || z !== 0) && seed % 3 !== 0,
        });
      }

  group.rotation.set(0.5, -0.72, 0);

  return {
    group,
    update(t: number, presence: number) {
      group.visible = presence > 0.001;
      if (!group.visible) return;
      glassMat.opacity = 0.5 * clamp01(presence * 1.5);
      edgeMat.opacity = 0.75 * clamp01(presence * 1.5);
      insetMat.opacity = 0.45 * clamp01(presence * 1.5);

      for (const pc of pieces) {
        // assemble: each piece flies in from further out, staggered
        const local = clamp01(presence * 1.6 - pc.delay * 0.6);
        const e = easeInOut(local);
        // idle: pieces slide in and out along their exposed face
        const slide = pc.slides ? Math.max(0, Math.sin(t * 0.9 + pc.phase)) ** 2 * cell * 0.28 : 0;
        pc.obj.position.copy(pc.rest).multiplyScalar(1 + (1 - e) * 1.6).addScaledVector(pc.out, slide);
        const s = Math.max(0.0001, e);
        if (pc.obj instanceof THREE.Mesh && pc.obj.geometry === sphereGeo) pc.obj.scale.setScalar(1.08 * s);
        else pc.obj.scale.setScalar(s);
      }
      inner.rotation.y = t * 0.12;
      group.rotation.x = 0.5 + Math.sin(t * 0.3) * 0.06;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export function createScene(container: HTMLElement, initial: Mode) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = buildEnvironment(renderer);
  const key = new THREE.DirectionalLight('#ffffff', 1.0);
  key.position.set(2, 3, 4);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const root = new THREE.Group();
  scene.add(root);

  const uTime = { value: 0 };
  const blob = createBlob(uTime);
  const ribbon = createRibbon(uTime);
  const blocks = createBlocks(uTime);
  root.add(blob.group, ribbon.group, blocks.group);

  const shapes = { strategize: blob, design: ribbon, build: blocks } as const;
  const presence: Record<Mode, number> = { strategize: 0, design: 0, build: 0 };
  let active: Mode = initial;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pointer: the object turns to face the cursor ----------------------
  const pointer = new THREE.Vector2();
  window.addEventListener(
    'pointermove',
    (e) => {
      const r = container.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      pointer.set(
        THREE.MathUtils.clamp((e.clientX - cx) / (window.innerWidth / 2), -1, 1),
        THREE.MathUtils.clamp((e.clientY - cy) / (window.innerHeight / 2), -1, 1),
      );
    },
    { passive: true },
  );

  // Resize ------------------------------------------------------------
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Portrait canvases (mobile): widen the vertical FOV so shapes fit the width instead of clipping.
    const half = THREE.MathUtils.degToRad(15);
    camera.fov = camera.aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(half) * 0.8) / camera.aspect)) : 30;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  // Visibility gating -------------------------------------------------
  let onScreen = true;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
  }).observe(container);

  let last = performance.now();
  let t = 0;

  renderer.setAnimationLoop((now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!onScreen || document.hidden) return;
    t += reduceMotion ? dt * 0.15 : dt * SPEED;
    uTime.value = t;

    // Sequenced transition: outgoing shapes collapse first, then the new one grows.
    const othersOut = (Object.keys(presence) as Mode[]).every((m) => m === active || presence[m] < 0.2);
    (Object.keys(presence) as Mode[]).forEach((m) => {
      const target = m === active && othersOut ? 1 : 0;
      presence[m] = damp(presence[m], target, m === active ? 5 : 9, dt);
      if (presence[m] < 0.0005 && target === 0) presence[m] = 0;
    });

    blob.update(t, presence.strategize);
    ribbon.update(t, presence.design);
    blocks.update(t, presence.build);
    blob.group.visible = presence.strategize > 0.001;
    ribbon.group.visible = presence.design > 0.001;

    root.rotation.y = damp(root.rotation.y, pointer.x * 0.75, 6, dt);
    root.rotation.x = damp(root.rotation.x, pointer.y * 0.55, 6, dt);
    root.position.x = damp(root.position.x, pointer.x * 0.12, 6, dt);
    root.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.05;

    renderer.render(scene, camera);
  });

  return {
    setMode(m: Mode) {
      active = m;
    },
    shapes,
  };
}
