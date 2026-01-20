/**
 * World data loader - fetches and parses JSON data files
 */

import type { StrategicLocation, Nation } from '../types';

export interface WorldDataFiles {
  locations: StrategicLocation[];
  nations: Nation[];
}

interface LocationsFile {
  locations: StrategicLocation[];
}

interface NationsFile {
  nations: Nation[];
}

/**
 * Load locations from JSON file
 */
export async function loadLocations(): Promise<StrategicLocation[]> {
  const response = await fetch('/src/data/locations.json');
  if (!response.ok) {
    throw new Error(`Failed to load locations: ${response.statusText}`);
  }
  const data: LocationsFile = await response.json();
  return data.locations;
}

/**
 * Load nations from JSON file
 */
export async function loadNations(): Promise<Nation[]> {
  const response = await fetch('/src/data/nations.json');
  if (!response.ok) {
    throw new Error(`Failed to load nations: ${response.statusText}`);
  }
  const data: NationsFile = await response.json();
  return data.nations;
}

/**
 * Load all world data from JSON files
 */
export async function loadWorldData(): Promise<WorldDataFiles> {
  const [locations, nations] = await Promise.all([
    loadLocations(),
    loadNations(),
  ]);

  return { locations, nations };
}
