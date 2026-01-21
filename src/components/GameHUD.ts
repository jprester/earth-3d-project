/**
 * Game HUD component displaying phase, time, resources, and controls
 */

import type {
  GamePhaseId,
  GameTime,
  SpeedMultiplier,
  FleetResources,
  ResourceType,
} from '../game/types';
import { GAME_PHASES, SPEED_LABELS } from '../game/types';

export interface GameHUDOptions {
  onPause?: () => void;
  onResume?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onSpeedChange?: (multiplier: SpeedMultiplier) => void;
}

const RESOURCE_ORDER: ResourceType[] = ['energy', 'kineticRods', 'drones', 'personnel'];

export class GameHUD {
  private container: HTMLDivElement;
  private options: GameHUDOptions;

  // State
  private isRunning: boolean = false;
  private currentPhase: GamePhaseId = 1;
  private currentTime: GameTime = { elapsedMs: 0, day: 1, hour: 0, minute: 0 };
  private currentSpeed: SpeedMultiplier = 1;
  private resources: FleetResources | null = null;

  // Element references
  private phaseLabel: HTMLDivElement | null = null;
  private dayLabel: HTMLDivElement | null = null;
  private timeLabel: HTMLDivElement | null = null;
  private speedLabel: HTMLDivElement | null = null;
  private playPauseBtn: HTMLButtonElement | null = null;
  private resourceBars: Map<ResourceType, HTMLDivElement> = new Map();

  constructor(options: GameHUDOptions = {}) {
    this.options = options;

    this.container = document.createElement('div');
    this.container.className = 'game-hud';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 10, 20, 0.9);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      color: #fff;
      z-index: 100;
      padding: 15px;
      min-width: 220px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    this.render();
  }

  private render(): void {
    // Phase section
    const phaseSection = this.createSection('Current Phase');
    this.phaseLabel = document.createElement('div');
    this.phaseLabel.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      color: #64c8ff;
    `;
    this.updatePhaseLabel();
    phaseSection.appendChild(this.phaseLabel);
    this.container.appendChild(phaseSection);

    // Time section
    const timeSection = this.createSection('Mission Time');
    const timeRow = document.createElement('div');
    timeRow.style.cssText = `
      display: flex;
      align-items: baseline;
      gap: 10px;
    `;

    this.dayLabel = document.createElement('div');
    this.dayLabel.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    `;

    this.timeLabel = document.createElement('div');
    this.timeLabel.style.cssText = `
      font-size: 14px;
      color: #888;
    `;

    this.updateTimeLabels();

    timeRow.appendChild(this.dayLabel);
    timeRow.appendChild(this.timeLabel);
    timeSection.appendChild(timeRow);
    this.container.appendChild(timeSection);

    // Resources section
    const resourceSection = this.createSection('Fleet Resources');
    const resourceGrid = document.createElement('div');
    resourceGrid.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    for (const type of RESOURCE_ORDER) {
      const bar = this.createResourceBar(type);
      resourceGrid.appendChild(bar);
    }

    resourceSection.appendChild(resourceGrid);
    this.container.appendChild(resourceSection);

    // Controls section
    const controlSection = this.createSection('Controls');
    const controlRow = document.createElement('div');
    controlRow.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    // Play/Pause button
    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.style.cssText = this.getButtonStyle();
    this.updatePlayPauseButton();
    this.playPauseBtn.onclick = () => {
      if (this.isRunning) {
        this.options.onPause?.();
      } else {
        this.options.onResume?.();
      }
    };

    // Speed button
    const speedBtn = document.createElement('button');
    speedBtn.style.cssText = this.getButtonStyle();
    this.speedLabel = document.createElement('div');
    this.speedLabel.textContent = SPEED_LABELS[this.currentSpeed];
    speedBtn.appendChild(this.speedLabel);
    speedBtn.onclick = () => {
      // Cycle through speeds: 1 -> 100 -> 500 -> 1440 -> 1
      const speeds: SpeedMultiplier[] = [1, 100, 500, 1440];
      const currentIndex = speeds.indexOf(this.currentSpeed);
      const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
      this.options.onSpeedChange?.(nextSpeed);
    };

    controlRow.appendChild(this.playPauseBtn);
    controlRow.appendChild(speedBtn);
    controlSection.appendChild(controlRow);

    // Save/Load row
    const saveLoadRow = document.createElement('div');
    saveLoadRow.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 8px;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = this.getButtonStyle(true);
    saveBtn.onclick = () => this.options.onSave?.();

    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.style.cssText = this.getButtonStyle(true);
    loadBtn.onclick = () => this.options.onLoad?.();

    saveLoadRow.appendChild(saveBtn);
    saveLoadRow.appendChild(loadBtn);
    controlSection.appendChild(saveLoadRow);

    this.container.appendChild(controlSection);
  }

  private createSection(title: string): HTMLDivElement {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 15px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(100, 200, 255, 0.15);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    `;
    header.textContent = title;
    section.appendChild(header);

    return section;
  }

  private createResourceBar(type: ResourceType): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Store reference for updates
    this.resourceBars.set(type, container);

    return container;
  }

  private updateResourceBar(type: ResourceType): void {
    const container = this.resourceBars.get(type);
    if (!container || !this.resources) return;

    const resource = this.resources[type];
    const percentage = (resource.current / resource.max) * 100;

    container.innerHTML = `
      <span style="width: 20px; text-align: center;">${resource.icon}</span>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #888;">${resource.displayName}</span>
          <span style="color: ${resource.color};">${Math.floor(resource.current)}/${resource.max}</span>
        </div>
        <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${percentage}%; background: ${resource.color}; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  private getButtonStyle(small: boolean = false): string {
    return `
      flex: 1;
      padding: ${small ? '6px 10px' : '8px 12px'};
      background: rgba(100, 200, 255, 0.1);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 4px;
      color: #64c8ff;
      cursor: pointer;
      font-family: inherit;
      font-size: ${small ? '11px' : '12px'};
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    `;
  }

  private updatePhaseLabel(): void {
    if (!this.phaseLabel) return;
    const phase = GAME_PHASES[this.currentPhase];
    this.phaseLabel.textContent = `${this.currentPhase}. ${phase.name}`;
  }

  private updateTimeLabels(): void {
    if (this.dayLabel) {
      this.dayLabel.textContent = `Day ${this.currentTime.day}`;
    }
    if (this.timeLabel) {
      const hour = this.currentTime.hour.toString().padStart(2, '0');
      const minute = this.currentTime.minute.toString().padStart(2, '0');
      this.timeLabel.textContent = `${hour}:${minute}`;
    }
  }

  private updatePlayPauseButton(): void {
    if (!this.playPauseBtn) return;
    this.playPauseBtn.innerHTML = this.isRunning
      ? '<span style="font-size: 14px;">⏸</span> Pause'
      : '<span style="font-size: 14px;">▶</span> Play';
  }

  // Public update methods

  setPhase(phase: GamePhaseId): void {
    this.currentPhase = phase;
    this.updatePhaseLabel();
  }

  setTime(time: GameTime): void {
    this.currentTime = time;
    this.updateTimeLabels();
  }

  setSpeed(speed: SpeedMultiplier): void {
    this.currentSpeed = speed;
    if (this.speedLabel) {
      this.speedLabel.textContent = SPEED_LABELS[speed];
    }
  }

  setResources(resources: FleetResources): void {
    this.resources = resources;
    for (const type of RESOURCE_ORDER) {
      this.updateResourceBar(type);
    }
  }

  setIsRunning(running: boolean): void {
    this.isRunning = running;
    this.updatePlayPauseButton();
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
