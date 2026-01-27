/**
 * Overlay toggle component for filtering marker visibility by type
 */

import type { LocationType } from '../types';

interface OverlayCategory {
  id: string;
  label: string;
  types: LocationType[];
  color: string;
  icon: string;
}

const CATEGORIES: OverlayCategory[] = [
  {
    id: 'capitals',
    label: 'Capitals',
    types: ['capital'],
    color: '#ffd700',
    icon: '★',
  },
  {
    id: 'cities',
    label: 'Cities',
    types: ['major_city', 'city'],
    color: '#ffffff',
    icon: '●',
  },
  {
    id: 'military',
    label: 'Military',
    types: ['military_base', 'air_base'],
    color: '#ff4444',
    icon: '⬟',
  },
  {
    id: 'naval',
    label: 'Naval',
    types: ['naval_base'],
    color: '#4488ff',
    icon: '⚓',
  },
  {
    id: 'nuclear',
    label: 'Nuclear',
    types: ['nuclear_silo'],
    color: '#ff0000',
    icon: '☢',
  },
  {
    id: 'command',
    label: 'Command',
    types: ['command_center'],
    color: '#ff8800',
    icon: '◆',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    types: ['power_plant', 'comm_hub'],
    color: '#00ffaa',
    icon: '⚡',
  },
];

export interface OverlayToggleOptions {
  onChange?: (visibleTypes: Set<LocationType>) => void;
}

export class OverlayToggle {
  private container: HTMLDivElement;
  private toggleStates: Map<string, boolean>;
  private options: OverlayToggleOptions;

  constructor(options: OverlayToggleOptions = {}) {
    this.options = options;
    this.toggleStates = new Map();

    // Initialize all categories as visible
    for (const category of CATEGORIES) {
      this.toggleStates.set(category.id, true);
    }

    this.container = document.createElement('div');
    this.container.className = 'overlay-toggle';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 10, 20, 0.9);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      color: #fff;
      z-index: 100;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    this.render();
  }

  private render(): void {
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64c8ff;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(100, 200, 255, 0.2);
    `;
    header.textContent = 'Map Layers';

    this.container.appendChild(header);

    // Toggle buttons grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    `;

    for (const category of CATEGORIES) {
      const btn = this.createToggleButton(category);
      grid.appendChild(btn);
    }

    this.container.appendChild(grid);

    // All/None buttons
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(100, 200, 255, 0.2);
    `;

    const allBtn = document.createElement('button');
    allBtn.textContent = 'All';
    allBtn.style.cssText = this.getControlButtonStyle();
    allBtn.onclick = () => this.setAll(true);

    const noneBtn = document.createElement('button');
    noneBtn.textContent = 'None';
    noneBtn.style.cssText = this.getControlButtonStyle();
    noneBtn.onclick = () => this.setAll(false);

    controls.appendChild(allBtn);
    controls.appendChild(noneBtn);
    this.container.appendChild(controls);
  }

  private createToggleButton(category: OverlayCategory): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.dataset.categoryId = category.id;

    const updateStyle = () => {
      const isActive = this.toggleStates.get(category.id);
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: ${isActive ? 'rgba(100, 200, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
        border: 1px solid ${isActive ? category.color : 'rgba(255, 255, 255, 0.1)'};
        border-radius: 4px;
        color: ${isActive ? '#fff' : '#666'};
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        transition: all 0.15s ease;
        text-align: left;
      `;
    };

    btn.innerHTML = `
      <span style="color: ${category.color}; font-size: 12px;">${category.icon}</span>
      <span>${category.label}</span>
    `;

    updateStyle();

    btn.onmouseenter = () => {
      if (!this.toggleStates.get(category.id)) {
        btn.style.background = 'rgba(255, 255, 255, 0.08)';
        btn.style.color = '#aaa';
      }
    };

    btn.onmouseleave = () => {
      updateStyle();
    };

    btn.onclick = () => {
      const newState = !this.toggleStates.get(category.id);
      this.toggleStates.set(category.id, newState);
      updateStyle();
      this.emitChange();
    };

    return btn;
  }

  private getControlButtonStyle(): string {
    return `
      flex: 1;
      padding: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(100, 200, 255, 0.2);
      border-radius: 4px;
      color: #888;
      cursor: pointer;
      font-family: inherit;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.15s ease;
    `;
  }

  private setAll(visible: boolean): void {
    for (const category of CATEGORIES) {
      this.toggleStates.set(category.id, visible);
    }

    // Re-render to update button states
    this.container.innerHTML = '';
    this.render();
    this.emitChange();
  }

  private emitChange(): void {
    if (!this.options.onChange) return;

    const visibleTypes = new Set<LocationType>();

    for (const category of CATEGORIES) {
      if (this.toggleStates.get(category.id)) {
        for (const type of category.types) {
          visibleTypes.add(type);
        }
      }
    }

    this.options.onChange(visibleTypes);
  }

  getVisibleTypes(): Set<LocationType> {
    const visibleTypes = new Set<LocationType>();

    for (const category of CATEGORIES) {
      if (this.toggleStates.get(category.id)) {
        for (const type of category.types) {
          visibleTypes.add(type);
        }
      }
    }

    return visibleTypes;
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
