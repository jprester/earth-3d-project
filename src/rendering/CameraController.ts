/**
 * Camera controller with zoom level presets and smooth transitions
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import type {
  CameraControllerOptions,
  CameraLevel,
  CameraLevelName,
  CameraLevels,
  Coordinates,
} from '../types';
import { latLngToVector3 } from '../world/GeoUtils';

// Camera level presets from ARCHITECTURE.md
export const CAMERA_LEVELS: CameraLevels = {
  solar: { distance: 50, fov: 45, showLabels: false, markerScale: 0.5 },
  orbital: { distance: 15, fov: 45, showLabels: true, markerScale: 1.0 },
  continental: { distance: 5, fov: 35, showLabels: true, markerScale: 1.5 },
  regional: { distance: 2.5, fov: 25, showLabels: true, markerScale: 2.0 },
  tactical: { distance: 1.2, fov: 20, showLabels: true, markerScale: 3.0 },
};

// Order of zoom levels for stepping through
const LEVEL_ORDER: CameraLevelName[] = ['solar', 'orbital', 'continental', 'regional', 'tactical'];

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private earthMesh: THREE.Mesh;
  private earthRadius: number;
  private earthCenter: THREE.Vector3;
  private isAnimating: boolean = false;
  private currentTween: gsap.core.Tween | null = null;
  private onZoomChange?: (level: CameraLevelName, distance: number) => void;
  private onFocusChange?: (target: THREE.Vector3) => void;

  // Bound event handlers for cleanup
  private keydownHandler: (e: KeyboardEvent) => void;
  private wheelHandler: (e: WheelEvent) => void;

  constructor(options: CameraControllerOptions) {
    this.camera = options.camera;
    this.earthMesh = options.earthMesh;
    this.earthRadius = options.earthRadius;
    this.earthCenter = this.earthMesh.position.clone();
    this.onZoomChange = options.onZoomChange;
    this.onFocusChange = options.onFocusChange;

    // Initialize OrbitControls
    this.controls = new OrbitControls(this.camera, options.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = this.earthRadius * 1.1; // Just above surface
    this.controls.maxDistance = CAMERA_LEVELS.solar.distance * 1.2;
    this.controls.target.copy(this.earthCenter);

    // Set up keyboard controls
    this.keydownHandler = this.handleKeydown.bind(this);
    window.addEventListener('keydown', this.keydownHandler);

    // Set up wheel handler for zoom level detection
    this.wheelHandler = this.handleWheel.bind(this);
    options.domElement.addEventListener('wheel', this.wheelHandler, { passive: true });
  }

  /**
   * Get the OrbitControls instance (for external access)
   */
  getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Get current camera distance from Earth center
   */
  getDistance(): number {
    return this.camera.position.distanceTo(this.earthCenter);
  }

  /**
   * Get current camera level based on distance
   */
  getCurrentLevel(): CameraLevelName {
    const distance = this.getDistance();

    // Find the closest matching level
    if (distance >= CAMERA_LEVELS.solar.distance * 0.7) return 'solar';
    if (distance >= CAMERA_LEVELS.orbital.distance * 0.7) return 'orbital';
    if (distance >= CAMERA_LEVELS.continental.distance * 0.7) return 'continental';
    if (distance >= CAMERA_LEVELS.regional.distance * 0.7) return 'regional';
    return 'tactical';
  }

  /**
   * Get the current level's configuration
   */
  getCurrentLevelConfig(): CameraLevel {
    return CAMERA_LEVELS[this.getCurrentLevel()];
  }

  /**
   * Get current marker scale based on distance
   */
  getMarkerScale(): number {
    const distance = this.getDistance();
    const config = this.getCurrentLevelConfig();

    // Interpolate marker scale based on distance within current level
    const baseScale = config.markerScale;

    // Scale up when zoomed in further than the level's target
    const levelDistance = CAMERA_LEVELS[this.getCurrentLevel()].distance;
    const scaleFactor = Math.max(1, levelDistance / distance);

    return baseScale * Math.min(scaleFactor, 2);
  }

  /**
   * Check if labels should be shown at current zoom
   */
  shouldShowLabels(): boolean {
    return this.getCurrentLevelConfig().showLabels;
  }

  /**
   * Animate to a specific zoom level
   */
  async setZoomLevel(level: CameraLevelName, duration: number = 1.0): Promise<void> {
    const targetConfig = CAMERA_LEVELS[level];

    // Cancel any existing animation
    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.isAnimating = true;

    // Calculate new camera position maintaining current direction
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.earthCenter)
      .normalize();

    const targetPosition = new THREE.Vector3()
      .copy(this.earthCenter)
      .addScaledVector(direction, targetConfig.distance);

    return new Promise((resolve) => {
      // Animate position
      this.currentTween = gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.controls.update();
        },
        onComplete: () => {
          this.isAnimating = false;
          this.currentTween = null;
          this.emitZoomChange();
          resolve();
        },
      });

      // Animate FOV
      gsap.to(this.camera, {
        fov: targetConfig.fov,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix();
        },
      });
    });
  }

  /**
   * Zoom in one level
   */
  async zoomIn(): Promise<void> {
    const currentLevel = this.getCurrentLevel();
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);

    if (currentIndex < LEVEL_ORDER.length - 1) {
      await this.setZoomLevel(LEVEL_ORDER[currentIndex + 1]);
    }
  }

  /**
   * Zoom out one level
   */
  async zoomOut(): Promise<void> {
    const currentLevel = this.getCurrentLevel();
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);

    if (currentIndex > 0) {
      await this.setZoomLevel(LEVEL_ORDER[currentIndex - 1]);
    }
  }

  /**
   * Focus on a specific geographic location (with zoom level change)
   */
  async focusOnLocation(
    coordinates: Coordinates,
    level?: CameraLevelName,
    duration: number = 1.5
  ): Promise<void> {
    const targetLevel = level ?? 'regional';
    const targetConfig = CAMERA_LEVELS[targetLevel];

    // Calculate position on globe surface
    const surfacePoint = latLngToVector3(coordinates, this.earthRadius);

    // Calculate camera position: surface point + outward direction * distance
    const direction = surfacePoint.clone().normalize();
    const targetPosition = new THREE.Vector3()
      .copy(surfacePoint)
      .addScaledVector(direction, targetConfig.distance - this.earthRadius);

    // Cancel existing animation
    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.isAnimating = true;

    return new Promise((resolve) => {
      // Animate position
      this.currentTween = gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          // Keep looking at Earth center during animation
          this.controls.target.copy(this.earthCenter);
          this.controls.update();
        },
        onComplete: () => {
          this.isAnimating = false;
          this.currentTween = null;
          this.emitZoomChange();
          this.onFocusChange?.(surfacePoint);
          resolve();
        },
      });

      // Animate FOV
      gsap.to(this.camera, {
        fov: targetConfig.fov,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix();
        },
      });
    });
  }

  /**
   * Pan to a specific geographic location without changing zoom level
   */
  async panToLocation(
    coordinates: Coordinates,
    duration: number = 1.0
  ): Promise<void> {
    // Calculate position on globe surface
    const surfacePoint = latLngToVector3(coordinates, this.earthRadius);

    // Keep current distance from Earth center
    const currentDistance = this.getDistance();

    // Calculate camera position: surface point + outward direction * current distance
    const direction = surfacePoint.clone().normalize();
    const targetPosition = new THREE.Vector3()
      .copy(surfacePoint)
      .addScaledVector(direction, currentDistance - this.earthRadius);

    // Cancel existing animation
    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.isAnimating = true;

    return new Promise((resolve) => {
      // Animate position only (no FOV change)
      this.currentTween = gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          // Keep looking at Earth center during animation
          this.controls.target.copy(this.earthCenter);
          this.controls.update();
        },
        onComplete: () => {
          this.isAnimating = false;
          this.currentTween = null;
          this.onFocusChange?.(surfacePoint);
          resolve();
        },
      });
    });
  }

  /**
   * Focus on a 3D position
   */
  async focusOnPosition(
    position: THREE.Vector3,
    level?: CameraLevelName,
    duration: number = 1.5
  ): Promise<void> {
    const targetLevel = level ?? 'regional';
    const targetConfig = CAMERA_LEVELS[targetLevel];

    // Calculate camera position: position + outward direction * distance
    const direction = position.clone().sub(this.earthCenter).normalize();
    const targetPosition = new THREE.Vector3()
      .copy(position)
      .addScaledVector(direction, targetConfig.distance - this.earthRadius);

    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.isAnimating = true;

    return new Promise((resolve) => {
      this.currentTween = gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.controls.target.copy(this.earthCenter);
          this.controls.update();
        },
        onComplete: () => {
          this.isAnimating = false;
          this.currentTween = null;
          this.emitZoomChange();
          this.onFocusChange?.(position);
          resolve();
        },
      });

      gsap.to(this.camera, {
        fov: targetConfig.fov,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix();
        },
      });
    });
  }

  /**
   * Reset camera to default orbital view
   */
  async resetView(duration: number = 1.0): Promise<void> {
    const targetConfig = CAMERA_LEVELS.orbital;

    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.isAnimating = true;

    // Default position: slightly elevated, looking at Earth
    const targetPosition = new THREE.Vector3(0, 5, targetConfig.distance);

    return new Promise((resolve) => {
      this.currentTween = gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.controls.target.copy(this.earthCenter);
          this.controls.update();
        },
        onComplete: () => {
          this.isAnimating = false;
          this.currentTween = null;
          this.emitZoomChange();
          resolve();
        },
      });

      gsap.to(this.camera, {
        fov: targetConfig.fov,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix();
        },
      });
    });
  }

  /**
   * Update method - call in animation loop
   */
  update(): void {
    if (!this.isAnimating) {
      this.controls.update();
    }
  }

  /**
   * Handle keyboard input
   */
  private handleKeydown(e: KeyboardEvent): void {
    // Ignore if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (e.key) {
      // Zoom level presets
      case '1':
        this.setZoomLevel('solar');
        break;
      case '2':
        this.setZoomLevel('orbital');
        break;
      case '3':
        this.setZoomLevel('continental');
        break;
      case '4':
        this.setZoomLevel('regional');
        break;
      case '5':
        this.setZoomLevel('tactical');
        break;

      // Incremental zoom
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;

      // Reset view
      case 'Home':
      case 'r':
      case 'R':
        this.resetView();
        break;
    }
  }

  /**
   * Handle mouse wheel for zoom level change detection
   */
  private handleWheel(_e: WheelEvent): void {
    // Emit zoom change after wheel event settles
    // Using a simple debounce pattern
    setTimeout(() => {
      this.emitZoomChange();
    }, 100);
  }

  /**
   * Emit zoom change event
   */
  private emitZoomChange(): void {
    if (this.onZoomChange) {
      this.onZoomChange(this.getCurrentLevel(), this.getDistance());
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.currentTween) {
      this.currentTween.kill();
    }

    window.removeEventListener('keydown', this.keydownHandler);
    if (this.controls.domElement) {
      this.controls.domElement.removeEventListener('wheel', this.wheelHandler);
    }
    this.controls.dispose();
  }
}
