/**
 * HumanNewsFeed - Displays news from the human perspective
 *
 * Shows breaking news, emergency broadcasts, and human reactions to the invasion.
 * Styled like a TV news ticker / emergency broadcast.
 */

import type { ScenarioEvent } from '../game/types';

interface NewsEntry {
  id: string;
  timestamp: string;
  headline: string;
  detail?: string;
  type: ScenarioEvent['type'];
  importance: ScenarioEvent['importance'];
}

export class HumanNewsFeed {
  private container: HTMLDivElement;
  private headerBar: HTMLDivElement;
  private entriesContainer: HTMLDivElement;
  private entries: NewsEntry[] = [];
  private maxEntries: number = 30;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'human-news-feed';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 380px;
      max-height: 280px;
      background: rgba(20, 0, 0, 0.92);
      border: 1px solid rgba(200, 50, 50, 0.4);
      border-radius: 4px;
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #ffffff;
      z-index: 100;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    `;

    // Breaking news header bar
    this.headerBar = document.createElement('div');
    this.headerBar.style.cssText = `
      padding: 6px 12px;
      background: linear-gradient(90deg, #cc0000 0%, #990000 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    `;

    const breakingLabel = document.createElement('div');
    breakingLabel.style.cssText = `
      background: #ffffff;
      color: #cc0000;
      padding: 2px 8px;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    breakingLabel.textContent = 'BREAKING';

    const liveIndicator = document.createElement('div');
    liveIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    liveIndicator.innerHTML = `
      <span style="
        width: 8px;
        height: 8px;
        background: #ff0000;
        border-radius: 50%;
        animation: livePulse 1s ease-in-out infinite;
      "></span>
      LIVE
    `;

    this.headerBar.appendChild(breakingLabel);
    this.headerBar.appendChild(liveIndicator);

    // Network label
    const networkBar = document.createElement('div');
    networkBar.style.cssText = `
      padding: 4px 12px;
      background: rgba(0, 0, 0, 0.5);
      border-bottom: 1px solid rgba(200, 50, 50, 0.3);
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    networkBar.textContent = 'Global Emergency Broadcast Network';

    // Entries container
    this.entriesContainer = document.createElement('div');
    this.entriesContainer.style.cssText = `
      padding: 8px;
      max-height: 200px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(200, 50, 50, 0.3) transparent;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes livePulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 8px #ff0000; }
        50% { opacity: 0.5; box-shadow: 0 0 4px #ff0000; }
      }
      @keyframes newsFlash {
        0% { background: rgba(255, 255, 0, 0.3); }
        100% { background: transparent; }
      }
      .news-entry-flash {
        animation: newsFlash 1s ease-out;
      }
      .human-news-feed::-webkit-scrollbar {
        width: 4px;
      }
      .human-news-feed::-webkit-scrollbar-track {
        background: transparent;
      }
      .human-news-feed::-webkit-scrollbar-thumb {
        background: rgba(200, 50, 50, 0.3);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);

    this.container.appendChild(this.headerBar);
    this.container.appendChild(networkBar);
    this.container.appendChild(this.entriesContainer);

    // Initial message
    this.addSystemMessage('Monitoring global communications...', 'minor');
  }

  /**
   * Add a news entry from a scenario event
   */
  addEntry(event: ScenarioEvent, gameTime: { day: number; hour: number; minute: number }): void {
    if (!event.newsHeadline) return;

    const entry: NewsEntry = {
      id: event.id,
      timestamp: this.formatTimestamp(gameTime),
      headline: event.newsHeadline,
      detail: event.newsDetail,
      type: event.type,
      importance: event.importance || 'minor',
    };

    this.entries.unshift(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this.render();

    // Flash header for critical news
    if (entry.importance === 'critical') {
      this.flashHeader();
    }
  }

  /**
   * Add a system message
   */
  addSystemMessage(message: string, importance: ScenarioEvent['importance'] = 'minor'): void {
    const entry: NewsEntry = {
      id: `sys-${Date.now()}`,
      timestamp: '',
      headline: message,
      type: 'narrative',
      importance,
    };

    this.entries.unshift(entry);
    this.render();
  }

  /**
   * Flash header for critical news
   */
  private flashHeader(): void {
    this.headerBar.style.animation = 'none';
    this.headerBar.offsetHeight; // Trigger reflow
    this.headerBar.style.animation = 'newsFlash 0.5s ease-out 3';
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(time: { day: number; hour: number; minute: number }): string {
    const h = time.hour.toString().padStart(2, '0');
    const m = time.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Get urgency styling
   */
  private getUrgencyStyle(importance: ScenarioEvent['importance']): { bg: string; border: string; textColor: string } {
    switch (importance) {
      case 'critical':
        return {
          bg: 'rgba(255, 0, 0, 0.15)',
          border: 'rgba(255, 0, 0, 0.4)',
          textColor: '#ff6666',
        };
      case 'major':
        return {
          bg: 'rgba(255, 150, 0, 0.1)',
          border: 'rgba(255, 150, 0, 0.3)',
          textColor: '#ffaa00',
        };
      default:
        return {
          bg: 'transparent',
          border: 'rgba(100, 100, 100, 0.2)',
          textColor: '#cccccc',
        };
    }
  }

  /**
   * Render entries to DOM
   */
  private render(): void {
    this.entriesContainer.innerHTML = '';

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const urgency = this.getUrgencyStyle(entry.importance);
      const isLatest = i === 0;

      const entryEl = document.createElement('div');
      entryEl.className = isLatest ? 'news-entry-flash' : '';
      entryEl.style.cssText = `
        margin-bottom: 8px;
        padding: 8px;
        background: ${urgency.bg};
        border-left: 3px solid ${urgency.border};
        border-radius: 2px;
      `;

      let html = '';

      if (entry.timestamp) {
        html += `<span style="color: #666; font-size: 10px; margin-right: 8px;">${entry.timestamp}</span>`;
      }

      html += `<span style="color: ${urgency.textColor}; font-weight: ${entry.importance === 'critical' ? 'bold' : 'normal'};">${entry.headline}</span>`;

      if (entry.detail) {
        html += `<div style="color: #888; font-size: 11px; margin-top: 4px; padding-left: 8px; border-left: 1px solid #444;">${entry.detail}</div>`;
      }

      entryEl.innerHTML = html;
      this.entriesContainer.appendChild(entryEl);
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.render();
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
