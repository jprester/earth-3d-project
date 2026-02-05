/**
 * Marker renderer for strategic location markers on the globe
 */

import * as THREE from "three";
import type {
  LocationState,
  LocationType,
  LocationStatus,
  Coordinates,
} from "../types";
import type { CameraController } from "./CameraController";
import { latLngToVector3, isPointVisibleFromCamera } from "../world/GeoUtils";

// Color palette for different location types
const TYPE_COLORS: Record<LocationType, number> = {
  capital: 0xffd700, // Gold
  major_city: 0xffffff, // White
  city: 0xcccccc, // Light gray
  military_base: 0xff4444, // Red
  nuclear_silo: 0xff0000, // Bright red
  naval_base: 0x4444ff, // Blue
  air_base: 0x44aaff, // Light blue
  command_center: 0xff8800, // Orange
  power_plant: 0x00ff88, // Green
  comm_hub: 0x00ffff, // Cyan
};

// Status modifiers for marker appearance
// All markers are always visible (no fog of war)
const STATUS_OPACITY: Record<LocationStatus, number> = {
  unknown: 1.0,
  detected: 1.0,
  analyzed: 1.0,
  targeted: 1.0,
  neutralized: 0.5,
  occupied: 1.0,
  contested: 0.9,
};

interface Marker {
  id: string;
  locationId: string;
  sprite: THREE.Sprite;
  type: LocationType;
  status: LocationStatus;
  coordinates: Coordinates;
  baseScale: number;
  isHighlighted: boolean;
  isSelected: boolean;
}

interface MarkerRendererOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cameraController: CameraController;
  earthMesh: THREE.Mesh;
  earthRadius: number;
  domElement: HTMLElement;
}

interface MarkerCallbacks {
  onHover?: (locationId: string | null) => void;
  onSelect?: (locationId: string | null) => void;
  onClick?: (locationId: string, coordinates: Coordinates) => void;
}

export class MarkerRenderer {
  private camera: THREE.PerspectiveCamera;
  private cameraController: CameraController;
  private earthMesh: THREE.Mesh;
  private earthRadius: number;
  private earthCenter: THREE.Vector3;
  private domElement: HTMLElement;

  private markers: Map<string, Marker>;
  private markerGroup: THREE.Group;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private hoveredMarkerId: string | null = null;
  private selectedMarkerId: string | null = null;

  private textures: Map<LocationType, THREE.Texture>;
  private highlightTextures: Map<LocationType, THREE.Texture>;

  private callbacks: MarkerCallbacks = {};

  // Bound event handlers
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;

  constructor(options: MarkerRendererOptions) {
    this.camera = options.camera;
    this.cameraController = options.cameraController;
    this.earthMesh = options.earthMesh;
    this.earthRadius = options.earthRadius;
    this.earthCenter = this.earthMesh.position.clone();
    this.domElement = options.domElement;

    this.markers = new Map();
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = "MarkerGroup";
    // Add marker group as child of Earth mesh so markers rotate with the globe
    this.earthMesh.add(this.markerGroup);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Pre-generate textures for each location type
    this.textures = new Map();
    this.highlightTextures = new Map();
    this.generateTextures();

    // Bind event handlers
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    this.clickHandler = this.handleClick.bind(this);

    this.domElement.addEventListener("mousemove", this.mouseMoveHandler);
    this.domElement.addEventListener("click", this.clickHandler);
  }

  /**
   * Generate canvas textures for each location type
   */
  private generateTextures(): void {
    const types: LocationType[] = [
      "capital",
      "major_city",
      "city",
      "military_base",
      "nuclear_silo",
      "naval_base",
      "air_base",
      "command_center",
      "power_plant",
      "comm_hub",
    ];

    for (const type of types) {
      // Normal texture
      this.textures.set(type, this.createMarkerTexture(type, false));
      // Highlighted texture
      this.highlightTextures.set(type, this.createMarkerTexture(type, true));
    }
  }

  /**
   * Create a canvas texture for a marker
   */
  private createMarkerTexture(
    type: LocationType,
    highlighted: boolean,
  ): THREE.Texture {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const color = TYPE_COLORS[type];
    const colorStr = `#${color.toString(16).padStart(6, "0")}`;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw outer glow if highlighted
    if (highlighted) {
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      gradient.addColorStop(0, colorStr);
      gradient.addColorStop(0.4, colorStr);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw main circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, highlighted ? 14 : 12, 0, Math.PI * 2);
    ctx.fillStyle = colorStr;
    ctx.fill();

    // Draw border
    ctx.strokeStyle = highlighted ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = highlighted ? 3 : 2;
    ctx.stroke();

    // Draw inner dot for important locations
    if (
      type === "capital" ||
      type === "nuclear_silo" ||
      type === "command_center"
    ) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Get base scale for a location type
   */
  private getBaseScale(type: LocationType): number {
    switch (type) {
      case "capital":
        return 0.15;
      case "major_city":
        return 0.12;
      case "nuclear_silo":
      case "command_center":
        return 0.13;
      case "military_base":
      case "naval_base":
      case "air_base":
        return 0.11;
      default:
        return 0.1;
    }
  }

  /**
   * Create a marker for a location
   */
  addMarker(location: LocationState): Marker {
    const texture = this.textures.get(location.type)!;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: STATUS_OPACITY[location.status],
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.name = `marker-${location.id}`;

    // Position on globe surface with slight altitude
    const position = latLngToVector3(
      location.coordinates,
      this.earthRadius,
      0.02,
    );
    sprite.position.copy(position);

    const baseScale = this.getBaseScale(location.type);
    sprite.scale.set(baseScale, baseScale, 1);

    // Store reference to location ID in userData
    sprite.userData.locationId = location.id;

    this.markerGroup.add(sprite);

    const marker: Marker = {
      id: `marker-${location.id}`,
      locationId: location.id,
      sprite,
      type: location.type,
      status: location.status,
      coordinates: location.coordinates,
      baseScale,
      isHighlighted: false,
      isSelected: false,
    };

    this.markers.set(location.id, marker);
    return marker;
  }

  /**
   * Remove a marker by location ID
   */
  removeMarker(locationId: string): void {
    const marker = this.markers.get(locationId);
    if (marker) {
      this.markerGroup.remove(marker.sprite);
      marker.sprite.material.dispose();
      this.markers.delete(locationId);
    }
  }

  /**
   * Add multiple markers from location array
   */
  addMarkers(locations: LocationState[]): void {
    for (const location of locations) {
      this.addMarker(location);
    }
  }

  /**
   * Clear all markers
   */
  clearMarkers(): void {
    for (const marker of this.markers.values()) {
      this.markerGroup.remove(marker.sprite);
      marker.sprite.material.dispose();
    }
    this.markers.clear();
    this.hoveredMarkerId = null;
    this.selectedMarkerId = null;
  }

  /**
   * Update marker appearance based on status
   */
  updateMarkerStatus(locationId: string, status: LocationStatus): void {
    const marker = this.markers.get(locationId);
    if (marker) {
      marker.status = status;
      const material = marker.sprite.material as THREE.SpriteMaterial;
      material.opacity = STATUS_OPACITY[status];
    }
  }

  /**
   * Set marker highlight state
   */
  setMarkerHighlight(locationId: string, highlighted: boolean): void {
    const marker = this.markers.get(locationId);
    if (marker && marker.isHighlighted !== highlighted) {
      marker.isHighlighted = highlighted;

      const material = marker.sprite.material as THREE.SpriteMaterial;
      const texture = highlighted
        ? this.highlightTextures.get(marker.type)!
        : this.textures.get(marker.type)!;

      material.map = texture;
      material.needsUpdate = true;
    }
  }

  /**
   * Set selected marker
   */
  selectMarker(locationId: string | null): void {
    // Deselect previous
    if (this.selectedMarkerId) {
      const prevMarker = this.markers.get(this.selectedMarkerId);
      if (prevMarker) {
        prevMarker.isSelected = false;
      }
    }

    this.selectedMarkerId = locationId;

    // Select new
    if (locationId) {
      const marker = this.markers.get(locationId);
      if (marker) {
        marker.isSelected = true;
      }
    }

    this.callbacks.onSelect?.(locationId);
  }

  /**
   * Get currently selected marker ID
   */
  getSelectedMarkerId(): string | null {
    return this.selectedMarkerId;
  }

  /**
   * Update all markers (call in animation loop)
   */
  update(): void {
    const markerScale = this.cameraController.getMarkerScale();

    for (const marker of this.markers.values()) {
      // Update scale based on camera distance
      const scale = marker.baseScale * markerScale;
      const selectedBonus = marker.isSelected ? 1.3 : 1;
      marker.sprite.scale.set(scale * selectedBonus, scale * selectedBonus, 1);

      // Get world position of marker (since markers are children of Earth mesh)
      const worldPos = new THREE.Vector3();
      marker.sprite.getWorldPosition(worldPos);

      // Check if marker is on the visible side of the globe
      const isVisible = isPointVisibleFromCamera(
        worldPos,
        this.camera,
        this.earthCenter,
        this.earthRadius,
      );

      const material = marker.sprite.material as THREE.SpriteMaterial;
      const statusOpacity = STATUS_OPACITY[marker.status];

      if (isVisible) {
        material.opacity = statusOpacity;
      } else {
        // Fade out markers on the back of the globe
        material.opacity = statusOpacity * 0.15;
      }
    }
  }

  /**
   * Handle mouse move for hover detection
   */
  handleMouseMove(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all sprites from the marker group
    const sprites = this.markerGroup.children.filter(
      (child) => child instanceof THREE.Sprite,
    );

    const intersects = this.raycaster.intersectObjects(sprites);

    let newHoveredId: string | null = null;

    if (intersects.length > 0) {
      // Find the first visible marker
      for (const intersect of intersects) {
        const material = (intersect.object as THREE.Sprite)
          .material as THREE.SpriteMaterial;
        if (material.opacity > 0.2) {
          newHoveredId = intersect.object.userData.locationId;
          break;
        }
      }
    }

    // Update hover state if changed
    if (newHoveredId !== this.hoveredMarkerId) {
      // Remove highlight from previous
      if (this.hoveredMarkerId) {
        this.setMarkerHighlight(this.hoveredMarkerId, false);
      }

      // Add highlight to new
      if (newHoveredId) {
        this.setMarkerHighlight(newHoveredId, true);
        this.domElement.style.cursor = "pointer";
      } else {
        this.domElement.style.cursor = "default";
      }

      this.hoveredMarkerId = newHoveredId;
      this.callbacks.onHover?.(newHoveredId);
    }
  }

  /**
   * Handle click for selection
   */
  handleClick(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const sprites = this.markerGroup.children.filter(
      (child) => child instanceof THREE.Sprite,
    );

    const intersects = this.raycaster.intersectObjects(sprites);

    if (intersects.length > 0) {
      // Find the first visible marker
      for (const intersect of intersects) {
        const material = (intersect.object as THREE.Sprite)
          .material as THREE.SpriteMaterial;
        if (material.opacity > 0.2) {
          const locationId = intersect.object.userData.locationId;
          const marker = this.markers.get(locationId);

          if (marker) {
            this.selectMarker(locationId);
            this.callbacks.onClick?.(locationId, marker.coordinates);
          }
          return;
        }
      }
    }

    // Clicked on empty space - deselect
    this.selectMarker(null);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: MarkerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Get marker by location ID
   */
  getMarker(locationId: string): Marker | undefined {
    return this.markers.get(locationId);
  }

  /**
   * Set which location types are visible
   */
  setVisibleTypes(visibleTypes: Set<LocationType>): void {
    for (const marker of this.markers.values()) {
      const shouldBeVisible = visibleTypes.has(marker.type);
      marker.sprite.visible = shouldBeVisible;
    }
  }

  /**
   * Get the currently hovered location ID
   */
  getHoveredMarkerId(): string | null {
    return this.hoveredMarkerId;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.domElement.removeEventListener("mousemove", this.mouseMoveHandler);
    this.domElement.removeEventListener("click", this.clickHandler);

    // Dispose all markers
    this.clearMarkers();

    // Dispose textures
    for (const texture of this.textures.values()) {
      texture.dispose();
    }
    for (const texture of this.highlightTextures.values()) {
      texture.dispose();
    }

    // Remove group from earth mesh
    this.earthMesh.remove(this.markerGroup);
  }
}
