import * as THREE from "three";

import { Tooltip } from "./components/Tooltip";
import { InfoPanel } from "./components/InfoPanel";
import { OverlayToggle } from "./components/OverlayToggle";
import { CameraController } from "./rendering/CameraController";
import { MarkerRenderer } from "./rendering/MarkerRenderer";
import { WorldData } from "./world/WorldData";
import { loadWorldData } from "./world/WorldDataLoader";
import { eventBus } from "./core/EventBus";
import { EARTH_RADIUS } from "./world/GeoUtils";
import { GameLoop, ScenarioEngine } from "./game";
import { AlienCommandFeed } from "./components/AlienCommandFeed";
import { HumanNewsFeed } from "./components/HumanNewsFeed";
import { PlaybackControls } from "./components/PlaybackControls";
import { firstContactScenario } from "./scenarios";
import type { SpeedMultiplier } from "./game/types";

import earthVertexShader from "./shaders/earthVertex.glsl?raw";
import earthFragmentShader from "./shaders/earthFragment.glsl?raw";
import starsVertexShader from "./shaders/starsVertex.glsl?raw";
import starsFragmentShader from "./shaders/starsFragment.glsl?raw";

export const initThreeScene = async (
  container: HTMLDivElement,
  onProgress?: (progress: number) => void,
  onComplete?: () => void,
): Promise<() => void> => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, // Start with orbital FOV
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Speed multiplier for rotation
  let speedMultiplier = 1;

  // LOD state variable
  let usingHighRes = false;
  let highResTexturesReady = false;

  // High-res texture references (only daymap and nightmap for performance)
  let earthTextureHD: THREE.Texture | null = null;
  let earthNightTextureHD: THREE.Texture | null = null;

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
    new THREE.BufferAttribute(positions, 3),
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

  // Progress tracking for all textures
  let lowResTexturesLoaded = 0;
  let highResTexturesLoaded = 0;
  let totalLowResTextures = 0;
  const totalHighResTextures = 2;

  const updateProgress = () => {
    const total = totalLowResTextures + totalHighResTextures;
    if (total === 0) return;

    const loadedTextures = lowResTexturesLoaded + highResTexturesLoaded;
    const progress = Math.min((loadedTextures / total) * 100, 100);

    console.log(
      `Progress: ${progress.toFixed(1)}% (Low: ${lowResTexturesLoaded}/${totalLowResTextures}, High: ${highResTexturesLoaded}/${totalHighResTextures})`,
    );

    if (onProgress) {
      onProgress(progress);
    }
  };

  // Create loading manager for texture loading
  const loadingManager = new THREE.LoadingManager(
    // onLoad callback
    () => {
      console.log("All low-res textures loaded successfully");
    },
    // onProgress callback
    (url, itemsLoaded, itemsTotal) => {
      lowResTexturesLoaded = itemsLoaded;
      totalLowResTextures = itemsTotal;

      console.log(`Loading low-res: ${url} (${itemsLoaded}/${itemsTotal})`);
      updateProgress();
    },
    // onError callback
    (url) => {
      console.error(`Failed to load texture: ${url}`);
    },
  );

  // Load Earth textures (2k versions)
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const earthTexture = textureLoader.load(
    "/assets/textures/2k_earth_daymap.jpg",
  );
  earthTexture.anisotropy = 16;
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earthNightTexture = textureLoader.load(
    "/assets/textures/2k_earth_nightmap.jpg",
  );
  earthNightTexture.anisotropy = 16;
  earthNightTexture.colorSpace = THREE.SRGBColorSpace;

  const earthNormalMap = textureLoader.load(
    "/assets/textures/2k_earth_normal_map.jpg",
  );

  const earthSpecularMap = textureLoader.load(
    "/assets/textures/2k_earth_specular_map.jpg",
  );

  // Load Moon textures
  const moonTexture = textureLoader.load("/assets/textures/moonmap4k.jpg");
  const moonBumpMap = textureLoader.load("/assets/textures/moonbump4k.jpg");

  // Load Earth cloud texture
  const earthCloudAlpha = textureLoader.load(
    "/assets/textures/2k_earth_clouds.jpg",
  );
  earthCloudAlpha.anisotropy = 16;

  // Preload high-resolution textures in the background
  console.log("Preloading high-resolution textures in background...");
  let hdTexturesLoaded = 0;
  const totalHDTextures = 2;

  const onHDTextureLoad = (texture: THREE.Texture) => {
    // Force texture upload to GPU to prevent stutter during swap
    renderer.initTexture(texture);

    hdTexturesLoaded++;
    highResTexturesLoaded = hdTexturesLoaded;
    updateProgress();

    if (hdTexturesLoaded === totalHDTextures) {
      highResTexturesReady = true;
      console.log("All high-resolution textures ready for instant swapping");

      // Notify that loading is complete
      if (onComplete) {
        onComplete();
      }
    }
  };

  earthTextureHD = textureLoader.load(
    "/assets/textures/8k_earth_daymap.jpg",
    (texture) => {
      texture.anisotropy = 16;
      texture.colorSpace = THREE.SRGBColorSpace;
      console.log("8k daymap loaded and configured");
      onHDTextureLoad(texture);
    },
  );

  earthNightTextureHD = textureLoader.load(
    "/assets/textures/8k_earth_nightmap.jpg",
    (texture) => {
      texture.anisotropy = 16;
      texture.colorSpace = THREE.SRGBColorSpace;
      console.log("8k nightmap loaded and configured");
      onHDTextureLoad(texture);
    },
  );

  // Earth configuration
  const earthRadius = EARTH_RADIUS;
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

  // Function to swap to high-resolution textures (instant since preloaded)
  const loadHighResTextures = () => {
    if (usingHighRes || !highResTexturesReady) return;

    console.log("Swapping to high-resolution textures...");

    earthMaterial.uniforms.dayTexture.value = earthTextureHD;
    earthMaterial.uniforms.nightTexture.value = earthNightTextureHD;
    earthMaterial.uniformsNeedUpdate = true;

    usingHighRes = true;
  };

  // Function to swap back to low-resolution textures
  const loadLowResTextures = () => {
    if (!usingHighRes) return;

    console.log("Swapping to low-resolution textures...");

    earthMaterial.uniforms.dayTexture.value = earthTexture;
    earthMaterial.uniforms.nightTexture.value = earthNightTexture;
    earthMaterial.uniformsNeedUpdate = true;

    usingHighRes = false;
  };

  // Moon configuration
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

  const moonOrbitRadius = earthRadius * 8;
  moon.position.x = moonOrbitRadius;
  scene.add(moon);

  // Set initial camera position (orbital view)
  camera.position.z = 15;
  camera.position.y = 5;

  // Create CameraController (replaces raw OrbitControls)
  const cameraController = new CameraController({
    camera,
    domElement: renderer.domElement,
    earthMesh: earth,
    earthRadius,
    onZoomChange: (level, distance) => {
      eventBus.emit("camera:zoom", { level, distance });
      console.log(`Camera zoom: ${level} (${distance.toFixed(2)} units)`);
    },
  });

  // Load world data
  console.log("Loading world data...");
  const { locations, nations } = await loadWorldData();
  const worldData = new WorldData();
  worldData.initialize(locations, nations);
  console.log(
    `Loaded ${locations.length} locations and ${nations.length} nations`,
  );

  // Create MarkerRenderer
  const markerRenderer = new MarkerRenderer({
    scene,
    camera,
    cameraController,
    earthMesh: earth,
    earthRadius,
    domElement: renderer.domElement,
  });

  // Add markers for all locations
  markerRenderer.addMarkers(worldData.getAllLocations());
  console.log(`Added ${worldData.getAllLocations().length} markers to globe`);

  // Create UI components
  const tooltip = new Tooltip();
  tooltip.appendTo(container);

  const infoPanel = new InfoPanel({
    onClose: () => {
      markerRenderer.selectMarker(null);
    },
    getNation: (nationId) => worldData.getNation(nationId),
  });
  infoPanel.appendTo(container);

  const overlayToggle = new OverlayToggle({
    onChange: (visibleTypes) => {
      markerRenderer.setVisibleTypes(visibleTypes);
    },
  });
  overlayToggle.appendTo(container);

  // Initialize game systems
  const gameLoop = new GameLoop({ initialSpeedMultiplier: 1 });
  const scenarioEngine = new ScenarioEngine();

  // Create narrative UI feeds
  const alienCommandFeed = new AlienCommandFeed();
  alienCommandFeed.appendTo(container);

  const humanNewsFeed = new HumanNewsFeed();
  humanNewsFeed.appendTo(container);

  // Create playback controls
  const playbackControls = new PlaybackControls({
    onPause: () => {
      gameLoop.pause();
      playbackControls.setIsPlaying(false);
    },
    onResume: () => {
      gameLoop.start();
      playbackControls.setIsPlaying(true);
    },
    onSpeedChange: (newSpeed: SpeedMultiplier) => {
      gameLoop.setSpeedMultiplier(newSpeed);
      speedMultiplier = newSpeed;
    },
  });
  playbackControls.appendTo(container);

  // Update time display on tick
  eventBus.on("game:tick", ({ time }) => {
    playbackControls.setTime(time);
  });

  // Subscribe to scenario events
  eventBus.on("scenario:eventTriggered", ({ event }) => {
    const time = gameLoop.getGameTime();

    // Update feeds
    alienCommandFeed.addEntry(event, time);
    humanNewsFeed.addEntry(event, time);

    // Update location status if effect specified
    if (event.effect) {
      const location = worldData.getLocation(event.effect.locationId);
      if (location) {
        if (event.effect.newStatus) {
          location.status = event.effect.newStatus;
        }
        if (event.effect.newControlledBy) {
          location.controlledBy = event.effect.newControlledBy;
        }
        if (event.effect.stabilityChange) {
          location.stability = Math.max(0, Math.min(100, location.stability + event.effect.stabilityChange));
        }
        // Update marker appearance
        markerRenderer.updateMarkerStatus(event.effect.locationId, location.status);
      }
    }

    // Focus camera on event location if requested
    if (event.focusCamera && event.locationId) {
      const location = worldData.getLocation(event.locationId);
      if (location) {
        cameraController.panToLocation(location.coordinates);
      }
    }
  });

  eventBus.on("scenario:complete", ({ scenarioId }) => {
    console.log(`Scenario "${scenarioId}" complete!`);
    alienCommandFeed.addSystemMessage("ALL OBJECTIVES COMPLETE");
    humanNewsFeed.addSystemMessage("Transmission ended.", "major");
  });

  // Load and start the scenario
  scenarioEngine.loadScenario(firstContactScenario);
  gameLoop.start();
  playbackControls.setIsPlaying(true);

  // Track mouse position for tooltip
  let mouseX = 0;
  let mouseY = 0;
  const handleMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    tooltip.updatePosition(mouseX, mouseY);
  };
  renderer.domElement.addEventListener("mousemove", handleMouseMove);

  // Set up marker event callbacks
  markerRenderer.setCallbacks({
    onHover: (locationId) => {
      eventBus.emit("marker:hover", { locationId });
      if (locationId) {
        const location = worldData.getLocation(locationId);
        if (location) {
          tooltip.show(location, mouseX, mouseY);
        }
      } else {
        tooltip.hide();
      }
    },
    onSelect: (locationId) => {
      eventBus.emit("marker:select", { locationId });
      if (locationId) {
        const location = worldData.getLocation(locationId);
        if (location) {
          // Show info panel
          infoPanel.show(location);
          // Pan camera to selected location (without changing zoom)
          cameraController.panToLocation(location.coordinates);
        }
      } else {
        infoPanel.hide();
      }
    },
    onClick: (locationId, coordinates) => {
      eventBus.emit("location:click", { locationId, coordinates });
    },
  });

  // Handle window resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  // Atmosphere
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
  const baseEarthRotationSpeed = (2 * Math.PI) / (24 * 60 * 60 * 60);

  let moonOrbitAngle = 0;

  function animate() {
    // Update camera controller
    cameraController.update();

    // Update marker renderer
    markerRenderer.update();

    // LOD: Check camera distance and swap textures
    const cameraDistance = camera.position.distanceTo(earth.position);
    const highResThreshold = 4;
    const lowResThreshold = 4;

    if (cameraDistance < highResThreshold && !usingHighRes) {
      loadHighResTextures();
    } else if (cameraDistance > lowResThreshold && usingHighRes) {
      loadLowResTextures();
    }

    // Calculate rotation speeds with multiplier
    const earthRotationSpeed = baseEarthRotationSpeed * speedMultiplier;
    const cloudRotationSpeed = earthRotationSpeed * 1.5;
    const moonOrbitSpeed = earthRotationSpeed / 27.3;
    const moonRotationSpeed = moonOrbitSpeed;

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

  // Start animation loop
  renderer.setAnimationLoop(animate);

  // Return cleanup function
  return () => {
    // Stop animation loop
    renderer.setAnimationLoop(null);

    // Remove event listeners
    window.removeEventListener("resize", handleResize);
    renderer.domElement.removeEventListener("mousemove", handleMouseMove);

    // Dispose new systems
    cameraController.dispose();
    markerRenderer.dispose();
    eventBus.clear();

    // Dispose game systems
    gameLoop.dispose();
    scenarioEngine.dispose();

    // Remove UI components
    tooltip.remove();
    infoPanel.remove();
    overlayToggle.remove();
    alienCommandFeed.remove();
    humanNewsFeed.remove();
    playbackControls.remove();

    // Remove DOM elements
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }

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

    // Dispose high-res textures if loaded
    if (earthTextureHD) earthTextureHD.dispose();
    if (earthNightTextureHD) earthNightTextureHD.dispose();

    // Dispose renderer
    renderer.dispose();
  };
};
