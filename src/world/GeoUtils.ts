/**
 * Geographic coordinate utilities for globe rendering
 */

import * as THREE from 'three';
import type { Coordinates } from '../types';

// Earth radius in scene units (matches threeScene.ts)
export const EARTH_RADIUS = 2;

// Earth's actual radius in kilometers (for distance calculations)
const EARTH_RADIUS_KM = 6371;

/**
 * Convert latitude/longitude to 3D Vector3 position on globe surface
 * Uses standard geographic conventions:
 * - Latitude: -90 (south pole) to +90 (north pole)
 * - Longitude: -180 to +180 (negative = west, positive = east)
 *
 * Three.js coordinate system:
 * - Y is up (north pole at +Y)
 * - X is right (0° longitude at +X)
 * - Z is towards camera (90° east at +Z)
 */
export function latLngToVector3(
  coords: Coordinates,
  radius: number = EARTH_RADIUS,
  altitude: number = 0
): THREE.Vector3 {
  const { lat, lng } = coords;

  // Convert to radians
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const r = radius + altitude;

  // Three.js SphereGeometry UV mapping:
  // - The texture's left edge (U=0) maps to the -X axis (lng = -180°)
  // - The texture's center (U=0.5) maps to the +X axis (lng = 0°)
  // - Phi (horizontal angle) goes from -PI to PI, starting at -X
  //
  // Standard spherical coordinates: x = r*cos(lat)*cos(lng), z = r*cos(lat)*sin(lng)
  // But Three.js sphere has phi starting at -X, so we need to adjust:
  // lng=0 should be at +X, which means phi=0 in standard coords
  // The texture center is at +X, so no offset needed for the base formula

  const x = r * Math.cos(latRad) * Math.cos(lngRad);
  const y = r * Math.sin(latRad);
  const z = -r * Math.cos(latRad) * Math.sin(lngRad); // Negate Z for correct handedness

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert 3D position to latitude/longitude
 */
export function vector3ToLatLng(position: THREE.Vector3): Coordinates {
  const radius = position.length();

  // Avoid division by zero
  if (radius === 0) {
    return { lat: 0, lng: 0 };
  }

  // Calculate latitude from Y component
  const lat = Math.asin(position.y / radius) * (180 / Math.PI);

  // Calculate longitude from X and Z components
  // Z is negated in latLngToVector3, so negate it back here
  const lng = Math.atan2(-position.z, position.x) * (180 / Math.PI);

  return { lat, lng };
}

/**
 * Calculate great circle distance between two coordinates (in kilometers)
 * Uses the Haversine formula
 */
export function greatCircleDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Check if a point is within a circular region
 */
export function isPointInRegion(
  point: Coordinates,
  center: Coordinates,
  radiusKm: number
): boolean {
  return greatCircleDistance(point, center) <= radiusKm;
}

/**
 * Raycast from screen coordinates to globe surface
 * Returns null if no intersection with the globe
 */
export function raycastToGlobe(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  earthMesh: THREE.Mesh,
  domElement: HTMLElement
): Coordinates | null {
  const rect = domElement.getBoundingClientRect();

  // Convert screen coordinates to normalized device coordinates (-1 to +1)
  const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  const intersects = raycaster.intersectObject(earthMesh);

  if (intersects.length > 0) {
    // Get the closest intersection point
    const point = intersects[0].point;
    return vector3ToLatLng(point);
  }

  return null;
}

/**
 * Calculate if a point on the globe is visible from the camera
 * (not occluded by the globe itself)
 */
export function isPointVisibleFromCamera(
  point: THREE.Vector3,
  camera: THREE.Camera,
  earthCenter: THREE.Vector3,
  _radius: number
): boolean {
  // Vector from point to camera
  const toCamera = new THREE.Vector3().subVectors(camera.position, point);

  // Normal at the point (pointing outward from center)
  const normal = new THREE.Vector3().subVectors(point, earthCenter).normalize();

  // Point is visible if the camera is on the same side as the normal
  // (dot product is positive means angle < 90°)
  return toCamera.dot(normal) > 0;
}

/**
 * Get a Vector3 on the surface directly facing the camera
 * Useful for calculating the visible center of the globe
 */
export function getCameraFacingPoint(
  camera: THREE.Camera,
  earthCenter: THREE.Vector3,
  radius: number
): THREE.Vector3 {
  const direction = new THREE.Vector3()
    .subVectors(earthCenter, camera.position)
    .normalize();

  return new THREE.Vector3()
    .copy(earthCenter)
    .addScaledVector(direction, -radius);
}

/**
 * Interpolate along a great circle path
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param t Interpolation factor (0-1)
 */
export function interpolateGreatCircle(
  start: Coordinates,
  end: Coordinates,
  t: number
): Coordinates {
  // Convert to radians
  const lat1 = (start.lat * Math.PI) / 180;
  const lng1 = (start.lng * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const lng2 = (end.lng * Math.PI) / 180;

  // Calculate angular distance
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng2 - lng1) / 2), 2)
    )
  );

  // Handle case where points are the same
  if (d === 0) {
    return { ...start };
  }

  const a = Math.sin((1 - t) * d) / Math.sin(d);
  const b = Math.sin(t * d) / Math.sin(d);

  const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
  const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
  const lng = Math.atan2(y, x) * (180 / Math.PI);

  return { lat, lng };
}

/**
 * Get the normal vector at a point on the globe surface
 */
export function getSurfaceNormal(coords: Coordinates): THREE.Vector3 {
  return latLngToVector3(coords, 1, 0).normalize();
}

/**
 * Calculate the bearing (direction) from one point to another
 * Returns angle in degrees (0 = north, 90 = east, etc.)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(y, x) * (180 / Math.PI);

  // Normalize to 0-360
  return (bearing + 360) % 360;
}
