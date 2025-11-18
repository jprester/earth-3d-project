import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SpeedControl } from "./components/SpeedControl";
import earthVertexShader from "./shaders/earthVertex.glsl?raw";
import earthFragmentShader from "./shaders/earthFragment.glsl?raw";
import starsVertexShader from "./shaders/starsVertex.glsl?raw";
import starsFragmentShader from "./shaders/starsFragment.glsl?raw";

export const initThreeScene = (container: HTMLDivElement) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);

  // Speed multiplier for rotation
  let speedMultiplier = 1;

  // Create UI controls for rotation speed
  const speedControl = new SpeedControl({
    defaultValue: speedMultiplier,
    onChange: (multiplier) => {
      speedMultiplier = multiplier;
    },
  });
  speedControl.appendTo(container);

  // Add ambient light for general illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambientLight);

  // Add directional light to simulate sunlight
  // Position at 90 degrees from vertical (horizontal plane)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(10, 0, 0);
  scene.add(sunLight);

  // Create starry background
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const alphas = new Float32Array(starCount);

  for (let i = 0; i < starCount * 3; i += 3) {
    // Random position in a sphere
    const radius = 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    // Random size between 0.3 and 1.5
    sizes[i / 3] = Math.random() * 1.2 + 0.3;

    // Random brightness between 0.1 and 0.5
    alphas[i / 3] = Math.random() * 0.6 + 0.1;
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  starsGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

  const starsMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: starsVertexShader,
    fragmentShader: starsFragmentShader,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Create loading manager for texture loading
  const loadingManager = new THREE.LoadingManager(
    // onLoad callback
    () => {
      console.log("All textures loaded successfully");
    },
    // onProgress callback
    (_url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(
        `Loading: ${progress.toFixed(0)}% (${itemsLoaded}/${itemsTotal})`
      );
    },
    // onError callback
    (url) => {
      console.error(`Failed to load texture: ${url}`);
    }
  );

  // Load Earth textures (2k versions)
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const earthTexture = textureLoader.load(
    "/assets/textures/2k_earth_daymap.jpg"
  );
  earthTexture.anisotropy = 16;
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earthNightTexture = textureLoader.load(
    "/assets/textures/2k_earth_nightmap.jpg"
  );
  earthNightTexture.anisotropy = 16;
  earthNightTexture.colorSpace = THREE.SRGBColorSpace;

  const earthNormalMap = textureLoader.load(
    "/assets/textures/2k_earth_normal_map.jpg"
  );

  const earthSpecularMap = textureLoader.load(
    "/assets/textures/2k_earth_specular_map.jpg"
  );

  // Load Moon textures
  const moonTexture = textureLoader.load("/assets/textures/moonmap4k.jpg");
  const moonBumpMap = textureLoader.load("/assets/textures/moonbump4k.jpg");

  // Load Earth cloud texture
  const earthCloudAlpha = textureLoader.load(
    "/assets/textures/2k_earth_clouds.jpg"
  );
  earthCloudAlpha.anisotropy = 16;

  // Earth configuration
  // Using 1 unit = 1000km for scale, Earth diameter is ~12.742km, so radius ~6.371 units scaled down
  const earthRadius = 2;
  const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

  // Create custom shader material for day/night cycle
  const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms: {
      dayTexture: { value: earthTexture },
      nightTexture: { value: earthNightTexture },
      normalMap: { value: earthNormalMap },
      specularMap: { value: earthSpecularMap },
      sunDirection: { value: new THREE.Vector3(10, 0, 0).normalize() },
      ambientColor: { value: new THREE.Color(0xffffff) },
      ambientIntensity: { value: 0.15 },
      sunColor: { value: new THREE.Color(0xffffff) },
      sunIntensity: { value: 1.2 },
      normalScale: { value: 0.5 },
      specularIntensity: { value: 0.5 },
      shininess: { value: 32.0 },
      debugNormals: { value: 0 },
    },
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Earth clouds layer
  // Clouds sit slightly above Earth's surface (atmosphere is ~10km thick for troposphere)
  const cloudRadius = earthRadius * 1.01;
  const cloudsGeometry = new THREE.SphereGeometry(cloudRadius, 64, 64);
  const cloudsMaterial = new THREE.MeshStandardMaterial({
    alphaMap: earthCloudAlpha,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    roughness: 1,
    metalness: 0,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  scene.add(clouds);

  // Moon configuration
  // Moon diameter is ~3.474km, about 27% of Earth's diameter
  const moonRadius = earthRadius * 0.27;
  const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    bumpMap: moonBumpMap,
    bumpScale: 0.02,
    roughness: 0.9,
    metalness: 0.1,
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);

  // Moon orbits at average distance of ~384,400km from Earth
  // Using our scale, that's about 30 Earth diameters
  const moonOrbitRadius = earthRadius * 8;
  moon.position.x = moonOrbitRadius;
  scene.add(moon);

  camera.position.z = 25;
  camera.position.y = 5;

  // Handle window resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  // atmosphere
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    opacity: 0.1,
    transparent: true,
    color: new THREE.Color("#4db2ff"),
  });

  const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.04);
  scene.add(atmosphere);

  // Realistic rotation speeds
  // Earth completes one rotation (2π radians) every 24 hours in real-time
  // At 60fps: 24 hours = 24 * 60 * 60 seconds = 86,400 seconds = 5,184,000 frames
  const baseEarthRotationSpeed = (2 * Math.PI) / (24 * 60 * 60 * 60); // radians per frame at 60fps

  let moonOrbitAngle = 0;

  function animate() {
    controls.update();

    // Calculate rotation speeds with multiplier
    const earthRotationSpeed = baseEarthRotationSpeed * speedMultiplier;
    const cloudRotationSpeed = earthRotationSpeed * 1.5; // Clouds rotate slightly faster
    const moonOrbitSpeed = earthRotationSpeed / 27.3; // Moon orbits in 27.3 days
    const moonRotationSpeed = moonOrbitSpeed; // Tidally locked

    // Rotate Earth on its axis
    earth.rotation.y += earthRotationSpeed;

    // Rotate clouds slightly faster than Earth
    clouds.rotation.y += cloudRotationSpeed;

    // Rotate Moon on its axis (slowly, tidally locked)
    moon.rotation.y += moonRotationSpeed;

    // Orbit Moon around Earth
    moonOrbitAngle += moonOrbitSpeed;
    moon.position.x = Math.cos(moonOrbitAngle) * moonOrbitRadius;
    moon.position.z = Math.sin(moonOrbitAngle) * moonOrbitRadius;

    renderer.render(scene, camera);
  }

  return () => {
    // Remove event listeners
    window.removeEventListener("resize", handleResize);

    // Remove DOM elements
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    speedControl.remove();

    // Dispose geometries
    starsGeometry.dispose();
    earthGeometry.dispose();
    cloudsGeometry.dispose();
    moonGeometry.dispose();

    // Dispose materials
    starsMaterial.dispose();
    earthMaterial.dispose();
    cloudsMaterial.dispose();
    atmosphereMaterial.dispose();
    moonMaterial.dispose();

    // Dispose textures
    earthTexture.dispose();
    earthNormalMap.dispose();
    earthSpecularMap.dispose();
    earthNightTexture.dispose();
    earthCloudAlpha.dispose();
    moonTexture.dispose();
    moonBumpMap.dispose();

    // Dispose renderer and controls
    renderer.dispose();
    controls.dispose();
  };
};
