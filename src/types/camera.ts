/**
 * Camera system types
 */

import * as THREE from 'three';

export type CameraLevelName = 'solar' | 'orbital' | 'continental' | 'regional' | 'tactical';

export interface CameraLevel {
  distance: number;
  fov: number;
  showLabels: boolean;
  markerScale: number;
}

export type CameraLevels = Record<CameraLevelName, CameraLevel>;

export interface CameraControllerOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  earthMesh: THREE.Mesh;
  earthRadius: number;
  onZoomChange?: (level: CameraLevelName, distance: number) => void;
  onFocusChange?: (target: THREE.Vector3) => void;
}
