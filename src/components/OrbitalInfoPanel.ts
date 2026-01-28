/**
 * OrbitalInfoPanel - Displays detailed info about ships and satellites
 */

import type { OrbitalObject } from '../rendering/FleetManager';

const TYPE_ICONS: Record<string, string> = {
  command_carrier: '👽',
  strike_cruiser: '🚀',
  kinetic_platform: '☄️',
  drone_carrier: '🛸',
  iss: '🛰️',
  gps: '📡',
  military: '🔭',
};

const TYPE_LABELS: Record<string, string> = {
  command_carrier: 'Command Carrier',
  strike_cruiser: 'Strike Cruiser',
  kinetic_platform: 'Kinetic Platform',
  drone_carrier: 'Drone Carrier',
  iss: 'Space Station',
  gps: 'Navigation Satellite',
  military: 'Reconnaissance Satellite',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#00ff88',
  disabled: '#ffaa00',
  destroyed: '#ff4444',
};

export interface OrbitalInfoPanelOptions {
  onClose?: () => void;
}

export class OrbitalInfoPanel {
  private container: HTMLDivElement;
  private content: HTMLDivElement;
  private currentObject: OrbitalObject | null = null;
  private options: OrbitalInfoPanelOptions;

  constructor(options: OrbitalInfoPanelOptions = {}) {
    this.options = options;

    this.container = document.createElement('div');
    this.container.className = 'orbital-info-panel';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 300px;
      background: rgba(0, 10, 20, 0.95);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      color: #fff;
      z-index: 101;
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
    title.textContent = 'Orbital Object';

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

  show(orbitalObject: OrbitalObject): void {
    this.currentObject = orbitalObject;
    this.render();

    this.container.style.opacity = '1';
    this.container.style.transform = 'translateX(0)';
    this.container.style.pointerEvents = 'auto';
  }

  hide(): void {
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(20px)';
    this.container.style.pointerEvents = 'none';
    this.currentObject = null;

    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  private render(): void {
    if (!this.currentObject) return;

    const obj = this.currentObject;
    const info = obj.info;
    const icon = TYPE_ICONS[obj.type] || '●';
    const typeLabel = TYPE_LABELS[obj.type] || obj.type;
    const statusColor = STATUS_COLORS[info.status];
    const categoryColor = info.category === 'alien' ? '#00ff88' : '#4488ff';
    const categoryLabel = info.category === 'alien' ? 'ALIEN VESSEL' : 'HUMAN ASSET';

    let html = `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 24px;">${icon}</span>
          <div>
            <div style="font-size: 16px; font-weight: bold;">${info.name}</div>
            <div style="color: #888; font-size: 11px;">${typeLabel}</div>
          </div>
        </div>
        <div style="
          display: inline-block;
          padding: 3px 8px;
          background: ${info.category === 'alien' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(68, 136, 255, 0.15)'};
          border: 1px solid ${categoryColor};
          border-radius: 3px;
          font-size: 9px;
          letter-spacing: 1px;
          color: ${categoryColor};
          margin-top: 8px;
        ">${categoryLabel}</div>
      </div>

      <div style="
        background: rgba(255,255,255,0.03);
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 12px;
        font-size: 12px;
        line-height: 1.5;
        color: #aaa;
      ">${info.description}</div>

      <div style="display: grid; gap: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Status</span>
          <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${info.status}</span>
        </div>
    `;

    if (info.orbitType) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Orbit</span>
          <span style="color: #64c8ff;">${info.orbitType}</span>
        </div>
      `;
    }

    if (info.operator) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <span style="color: #888;">Operator</span>
          <span style="color: #ccc;">${info.operator}</span>
        </div>
      `;
    }

    html += `</div>`;

    // Capabilities section
    if (info.capabilities && info.capabilities.length > 0) {
      html += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(100, 200, 255, 0.2);">
          <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Capabilities</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${info.capabilities.map(cap => `
              <span style="
                display: inline-block;
                padding: 4px 8px;
                background: ${info.category === 'alien' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(68, 136, 255, 0.1)'};
                border: 1px solid ${info.category === 'alien' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(68, 136, 255, 0.3)'};
                border-radius: 3px;
                font-size: 10px;
                color: ${info.category === 'alien' ? '#00ff88' : '#64c8ff'};
              ">${cap}</span>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.content.innerHTML = html;
  }

  isVisible(): boolean {
    return this.currentObject !== null;
  }

  getCurrentObjectId(): string | null {
    return this.currentObject?.id ?? null;
  }

  remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
