/**
 * PlaybackControls - Simple controls for pausing/resuming and controlling speed
 */

import type { GameTime, SpeedMultiplier } from '../game/types';
import { SPEED_PRESETS, SPEED_LABELS } from '../game/types';

export interface PlaybackControlsOptions {
  onPause?: () => void;
  onResume?: () => void;
  onSpeedChange?: (speed: SpeedMultiplier) => void;
}

export class PlaybackControls {
  private container: HTMLDivElement;
  private timeDisplay: HTMLDivElement;
  private playPauseBtn: HTMLButtonElement;
  private speedDisplay: HTMLDivElement;
  private options: PlaybackControlsOptions;
  private isPlaying: boolean = false;
  private currentSpeed: SpeedMultiplier = 1;

  constructor(options: PlaybackControlsOptions = {}) {
    this.options = options;

    this.container = document.createElement('div');
    this.container.className = 'playback-controls';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 10, 20, 0.9);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      color: #fff;
      z-index: 100;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      min-width: 120px;
      text-align: center;
    `;
    this.timeDisplay.textContent = 'Day 1 00:00';

    // Play/Pause button
    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.style.cssText = `
      background: rgba(100, 200, 255, 0.2);
      border: 1px solid rgba(100, 200, 255, 0.5);
      border-radius: 4px;
      color: #64c8ff;
      cursor: pointer;
      font-family: inherit;
      font-size: 16px;
      padding: 6px 12px;
      transition: all 0.15s ease;
      min-width: 80px;
    `;
    this.playPauseBtn.textContent = '▶ Play';
    this.playPauseBtn.onclick = () => this.togglePlayPause();
    this.playPauseBtn.onmouseenter = () => {
      this.playPauseBtn.style.background = 'rgba(100, 200, 255, 0.3)';
    };
    this.playPauseBtn.onmouseleave = () => {
      this.playPauseBtn.style.background = 'rgba(100, 200, 255, 0.2)';
    };

    // Speed controls
    const speedControls = document.createElement('div');
    speedControls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const speedLabel = document.createElement('span');
    speedLabel.style.cssText = 'color: #888; font-size: 11px;';
    speedLabel.textContent = 'Speed:';

    this.speedDisplay = document.createElement('div');
    this.speedDisplay.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    // Create speed buttons
    for (const speed of SPEED_PRESETS) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        background: ${speed === this.currentSpeed ? 'rgba(100, 200, 255, 0.3)' : 'rgba(100, 200, 255, 0.1)'};
        border: 1px solid ${speed === this.currentSpeed ? 'rgba(100, 200, 255, 0.6)' : 'rgba(100, 200, 255, 0.3)'};
        border-radius: 3px;
        color: ${speed === this.currentSpeed ? '#fff' : '#64c8ff'};
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        padding: 4px 8px;
        transition: all 0.15s ease;
      `;
      btn.textContent = SPEED_LABELS[speed] || `${speed}x`;
      btn.dataset.speed = String(speed);
      btn.onclick = () => this.setSpeed(speed);
      this.speedDisplay.appendChild(btn);
    }

    speedControls.appendChild(speedLabel);
    speedControls.appendChild(this.speedDisplay);

    this.container.appendChild(this.timeDisplay);
    this.container.appendChild(this.playPauseBtn);
    this.container.appendChild(speedControls);
  }

  private togglePlayPause(): void {
    if (this.isPlaying) {
      this.options.onPause?.();
    } else {
      this.options.onResume?.();
    }
  }

  private setSpeed(speed: SpeedMultiplier): void {
    this.currentSpeed = speed;
    this.options.onSpeedChange?.(speed);
    this.updateSpeedButtons();
  }

  private updateSpeedButtons(): void {
    const buttons = this.speedDisplay.querySelectorAll('button');
    buttons.forEach((btn) => {
      const speed = Number(btn.dataset.speed);
      const isActive = speed === this.currentSpeed;
      btn.style.background = isActive ? 'rgba(100, 200, 255, 0.3)' : 'rgba(100, 200, 255, 0.1)';
      btn.style.borderColor = isActive ? 'rgba(100, 200, 255, 0.6)' : 'rgba(100, 200, 255, 0.3)';
      btn.style.color = isActive ? '#fff' : '#64c8ff';
    });
  }

  setTime(time: GameTime): void {
    const h = time.hour.toString().padStart(2, '0');
    const m = time.minute.toString().padStart(2, '0');
    this.timeDisplay.textContent = `Day ${time.day} ${h}:${m}`;
  }

  setIsPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.playPauseBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
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
