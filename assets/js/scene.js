import * as THREE from "../vendor/three/three.module.min.js";

(() => {
  "use strict";

  const canvas = document.getElementById("scene-canvas");
  if (!canvas || !window.WebGLRenderingContext) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (e) {
    return; // WebGL unavailable — canvas stays as flat dark background
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 9);

  /* -----------------------------------------------------------------------
     Wireframe geometric shapes
     ----------------------------------------------------------------------- */
  const shapesGroup = new THREE.Group();

  const makeWireShape = (geometry, color, position, scale) => {
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
    });
    const mesh = new THREE.LineSegments(edges, material);
    mesh.position.set(...position);
    mesh.scale.setScalar(scale);
    return mesh;
  };

  const icosahedron = makeWireShape(
    new THREE.IcosahedronGeometry(1.3, 0),
    0x00d4ff,
    [-4.2, 1.1, -2],
    1
  );
  const torus = makeWireShape(
    new THREE.TorusGeometry(1, 0.36, 8, 32),
    0x7c3aed,
    [4, -1.2, -3],
    1
  );
  const octahedron = makeWireShape(
    new THREE.OctahedronGeometry(0.9, 0),
    0xf472b6,
    [1.8, 2.2, -4],
    1
  );
  const box = makeWireShape(
    new THREE.BoxGeometry(1.1, 1.1, 1.1),
    0x00d4ff,
    [-2.6, -2.1, -3.5],
    0.8
  );

  shapesGroup.add(icosahedron, torus, octahedron, box);
  scene.add(shapesGroup);

  /* -----------------------------------------------------------------------
     Particle field (data stream)
     ----------------------------------------------------------------------- */
  const isMobile = window.innerWidth < 720;
  const particleCount = isMobile ? 300 : 850;
  const bounds = { x: 9, yTop: 6, yBottom: -6, z: 6 };

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds.x * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * (bounds.yTop - bounds.yBottom);
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z * 2 - 2;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.028,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  /* -----------------------------------------------------------------------
     Mouse parallax
     ----------------------------------------------------------------------- */
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  window.addEventListener(
    "pointermove",
    (e) => {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  /* -----------------------------------------------------------------------
     Resize
     ----------------------------------------------------------------------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* -----------------------------------------------------------------------
     Render loop
     ----------------------------------------------------------------------- */
  const rotSpeed = prefersReducedMotion ? 0.02 : 1;
  let running = true;

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(animate);
  });

  const posAttr = particleGeometry.getAttribute("position");

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    const t = performance.now() * 0.0001;

    icosahedron.rotation.x += 0.0016 * rotSpeed;
    icosahedron.rotation.y += 0.0022 * rotSpeed;

    torus.rotation.x += 0.001 * rotSpeed;
    torus.rotation.y += 0.0026 * rotSpeed;

    octahedron.rotation.x -= 0.002 * rotSpeed;
    octahedron.rotation.z += 0.0014 * rotSpeed;

    box.rotation.y -= 0.0018 * rotSpeed;
    box.rotation.x += 0.0011 * rotSpeed;

    shapesGroup.position.y = Math.sin(t * 6) * 0.15;

    if (!prefersReducedMotion) {
      const arr = posAttr.array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += 0.0035;
        if (arr[i * 3 + 1] > bounds.yTop) {
          arr[i * 3 + 1] = bounds.yBottom;
        }
      }
      posAttr.needsUpdate = true;
    }

    mouse.x += (targetMouse.x - mouse.x) * 0.04;
    mouse.y += (targetMouse.y - mouse.y) * 0.04;

    camera.position.x = mouse.x * 0.7;
    camera.position.y = -mouse.y * 0.5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();
})();
