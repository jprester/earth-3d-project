/**
 * Info panel component for displaying detailed location information
 */

import type { LocationState, LocationType, LocationStatus, NationState } from '../types';

const TYPE_LABELS: Record<LocationType, string> = {
  capital: 'Capital City',
  major_city: 'Major City',
  city: 'City',
  military_base: 'Military Base',
  nuclear_silo: 'Nuclear Missile Silo',
  naval_base: 'Naval Base',
  air_base: 'Air Force Base',
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

const STATUS_LABELS: Record<LocationStatus, string> = {
  unknown: 'Unknown',
  detected: 'Detected',
  analyzed: 'Analyzed',
  targeted: 'Targeted',
  neutralized: 'Neutralized',
  occupied: 'Occupied',
  contested: 'Contested',
};

const STATUS_COLORS: Record<LocationStatus, string> = {
  unknown: '#666',
  detected: '#ffaa00',
  analyzed: '#00ff88',
  targeted: '#ff4444',
  neutralized: '#888',
  occupied: '#4488ff',
  contested: '#ff8800',
};

export interface InfoPanelOptions {
  onClose?: () => void;
  onFocus?: (locationId: string) => void;
  getNation?: (nationId: string) => NationState | undefined;
}

export class InfoPanel {
  private container: HTMLDivElement;
  private content: HTMLDivElement;
  private currentLocation: LocationState | null = null;
  private options: InfoPanelOptions;

  constructor(options: InfoPanelOptions = {}) {
    this.options = options;

    this.container = document.createElement('div');
    this.container.className = 'info-panel';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 280px;
      background: rgba(0, 10, 20, 0.9);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      color: #fff;
      z-index: 100;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid rgba(100, 200, 255, 0.2);
      background: rgba(100, 200, 255, 0.1);
      border-radius: 8px 8px 0 0;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64c8ff;
    `;
    title.textContent = 'Location Intel';

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      line-height: 1;
      transition: color 0.15s;
    `;
    closeBtn.textContent = '×';
    closeBtn.onmouseenter = () => closeBtn.style.color = '#fff';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#888';
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content area
    this.content = document.createElement('div');
    this.content.style.cssText = `
      padding: 15px;
    `;

    this.container.appendChild(header);
    this.container.appendChild(this.content);
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  show(location: LocationState): void {
    this.currentLocation = location;
    this.render();

    this.container.style.opacity = '1';
    this.container.style.transform = 'translateX(0)';
    this.container.style.pointerEvents = 'auto';
  }

  hide(): void {
    // Guard against multiple calls / recursive loops
    if (this.currentLocation === null) return;

    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(20px)';
    this.container.style.pointerEvents = 'none';
    this.currentLocation = null;

    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  private render(): void {
    if (!this.currentLocation) return;

    const loc = this.currentLocation;
    const icon = TYPE_ICONS[loc.type];
    const typeLabel = TYPE_LABELS[loc.type];
    const statusLabel = STATUS_LABELS[loc.status];
    const statusColor = STATUS_COLORS[loc.status];

    let html = `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 20px;">${icon}</span>
          <span style="font-size: 16px; font-weight: bold;">${loc.name}</span>
        </div>
        <div style="color: #888; font-size: 12px;">${typeLabel}</div>
      </div>

      <div style="display: grid; gap: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Status</span>
          <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span>
        </div>

        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Control</span>
          <span style="color: ${this.getControlColor(loc.controlledBy)};">${this.capitalizeFirst(loc.controlledBy)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Stability</span>
          <span>${this.renderStabilityBar(loc.stability)}</span>
        </div>
    `;

    if (loc.population) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Population</span>
          <span>${this.formatNumber(loc.population)}</span>
        </div>
      `;
    }

    if (loc.defenseRating) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Defense Rating</span>
          <span style="color: #ff8866;">${this.renderDefenseBar(loc.defenseRating)}</span>
        </div>
      `;
    }

    if (loc.nuclearCapacity) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(80,0,0,0.3); border-radius: 4px; border: 1px solid rgba(255,0,0,0.3);">
          <span style="color: #ff6666;">☢ Nuclear</span>
          <span style="color: #ff4444; font-weight: bold;">${loc.nuclearCapacity} warheads</span>
        </div>
      `;
    }

    if (loc.gridCapacity) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Grid Capacity</span>
          <span style="color: #00ff88;">${loc.gridCapacity} MW</span>
        </div>
      `;
    }

    html += `
      </div>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(100, 200, 255, 0.2);">
        <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Coordinates</div>
        <div style="font-size: 11px; color: #888;">
          ${loc.coordinates.lat.toFixed(4)}°${loc.coordinates.lat >= 0 ? 'N' : 'S'},
          ${Math.abs(loc.coordinates.lng).toFixed(4)}°${loc.coordinates.lng >= 0 ? 'E' : 'W'}
        </div>
      </div>
    `;

    this.content.innerHTML = html;
  }

  private renderStabilityBar(stability: number): string {
    const color = stability > 70 ? '#00ff88' : stability > 40 ? '#ffaa00' : '#ff4444';
    return `
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
          <div style="width: ${stability}%; height: 100%; background: ${color};"></div>
        </div>
        <span style="font-size: 11px; color: ${color};">${stability}%</span>
      </div>
    `;
  }

  private renderDefenseBar(rating: number): string {
    const filled = '▮'.repeat(rating);
    const empty = '▯'.repeat(10 - rating);
    return `<span style="font-size: 10px; letter-spacing: -1px;">${filled}</span><span style="font-size: 10px; letter-spacing: -1px; color: #444;">${empty}</span>`;
  }

  private getControlColor(control: string): string {
    switch (control) {
      case 'human': return '#00ff88';
      case 'alien': return '#4488ff';
      case 'contested': return '#ff8800';
      case 'destroyed': return '#666';
      default: return '#888';
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return Math.round(num / 1000) + 'K';
    }
    return num.toString();
  }

  isVisible(): boolean {
    return this.currentLocation !== null;
  }

  getCurrentLocationId(): string | null {
    return this.currentLocation?.id ?? null;
  }

  remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
