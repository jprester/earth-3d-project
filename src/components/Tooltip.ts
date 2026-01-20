/**
 * Tooltip component for displaying location info on hover
 */

import type { LocationState, LocationType } from '../types';

const TYPE_LABELS: Record<LocationType, string> = {
  capital: 'Capital',
  major_city: 'Major City',
  city: 'City',
  military_base: 'Military Base',
  nuclear_silo: 'Nuclear Silo',
  naval_base: 'Naval Base',
  air_base: 'Air Base',
  command_center: 'Command Center',
  power_plant: 'Power Plant',
  comm_hub: 'Communications Hub',
};

const TYPE_ICONS: Record<LocationType, string> = {
  capital: '★',
  major_city: '●',
  city: '○',
  military_base: '⬟',
  nuclear_silo: '☢',
  naval_base: '⚓',
  air_base: '✈',
  command_center: '◆',
  power_plant: '⚡',
  comm_hub: '📡',
};

export class Tooltip {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'game-tooltip';
    this.container.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(100, 200, 255, 0.5);
      border-radius: 4px;
      padding: 8px 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #fff;
      opacity: 0;
      transition: opacity 0.15s ease;
      max-width: 250px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    `;
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  show(location: LocationState, x: number, y: number): void {
    const icon = TYPE_ICONS[location.type];
    const typeLabel = TYPE_LABELS[location.type];

    let content = `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
        <span style="font-size: 14px;">${icon}</span>
        <span style="font-weight: bold; color: #64c8ff;">${location.name}</span>
      </div>
      <div style="color: #aaa; font-size: 11px;">${typeLabel}</div>
    `;

    if (location.population) {
      content += `<div style="color: #888; font-size: 11px; margin-top: 4px;">Pop: ${this.formatNumber(location.population)}</div>`;
    }

    if (location.defenseRating) {
      content += `<div style="color: #ff8866; font-size: 11px;">Defense: ${location.defenseRating}/10</div>`;
    }

    if (location.nuclearCapacity) {
      content += `<div style="color: #ff4444; font-size: 11px;">Nuclear: ${location.nuclearCapacity} warheads</div>`;
    }

    this.container.innerHTML = content;

    // Position tooltip near cursor, but keep on screen
    const padding = 15;
    const rect = this.container.getBoundingClientRect();

    let left = x + padding;
    let top = y + padding;

    // Adjust if going off right edge
    if (left + rect.width > window.innerWidth - padding) {
      left = x - rect.width - padding;
    }

    // Adjust if going off bottom edge
    if (top + rect.height > window.innerHeight - padding) {
      top = y - rect.height - padding;
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
    this.container.style.opacity = '1';
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.opacity = '0';
    this.isVisible = false;
  }

  updatePosition(x: number, y: number): void {
    if (!this.isVisible) return;

    const padding = 15;
    const rect = this.container.getBoundingClientRect();

    let left = x + padding;
    let top = y + padding;

    if (left + rect.width > window.innerWidth - padding) {
      left = x - rect.width - padding;
    }

    if (top + rect.height > window.innerHeight - padding) {
      top = y - rect.height - padding;
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }

  remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
