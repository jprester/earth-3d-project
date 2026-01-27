/**
 * AlienCommandFeed - Displays alien command messages in a terminal-like UI
 *
 * Shows the invasion from the alien perspective with a cold, tactical feel.
 */

import type { ScenarioEvent } from '../game/types';

interface FeedEntry {
  id: string;
  timestamp: string;
  message: string;
  type: ScenarioEvent['type'];
  importance: ScenarioEvent['importance'];
}

export class AlienCommandFeed {
  private container: HTMLDivElement;
  private entriesContainer: HTMLDivElement;
  private entries: FeedEntry[] = [];
  private maxEntries: number = 50;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'alien-command-feed';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 320px;
      max-height: 300px;
      background: rgba(0, 5, 15, 0.92);
      border: 1px solid rgba(0, 200, 100, 0.3);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #00cc66;
      z-index: 100;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 200, 100, 0.03);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 12px;
      background: rgba(0, 200, 100, 0.1);
      border-bottom: 1px solid rgba(0, 200, 100, 0.2);
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const indicator = document.createElement('div');
    indicator.style.cssText = `
      width: 8px;
      height: 8px;
      background: #00ff66;
      border-radius: 50%;
      box-shadow: 0 0 8px #00ff66;
      animation: pulse 2s ease-in-out infinite;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 10px;
      color: #00cc66;
    `;
    title.textContent = 'Command Interface';

    header.appendChild(indicator);
    header.appendChild(title);

    // Entries container
    this.entriesContainer = document.createElement('div');
    this.entriesContainer.style.cssText = `
      padding: 8px;
      max-height: 250px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 200, 100, 0.3) transparent;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes feedEntryIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .alien-feed-entry {
        animation: feedEntryIn 0.3s ease-out;
      }
      .alien-command-feed::-webkit-scrollbar {
        width: 4px;
      }
      .alien-command-feed::-webkit-scrollbar-track {
        background: transparent;
      }
      .alien-command-feed::-webkit-scrollbar-thumb {
        background: rgba(0, 200, 100, 0.3);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);

    this.container.appendChild(header);
    this.container.appendChild(this.entriesContainer);

    // Initial message
    this.addSystemMessage('ESTABLISHING ORBITAL LINK...');
    setTimeout(() => {
      this.addSystemMessage('CONNECTION SECURED');
      this.addSystemMessage('AWAITING COMMAND DIRECTIVES');
    }, 500);
  }

  /**
   * Add a new entry from a scenario event
   */
  addEntry(event: ScenarioEvent, gameTime: { day: number; hour: number; minute: number }): void {
    if (!event.alienMessage) return;

    const entry: FeedEntry = {
      id: event.id,
      timestamp: this.formatTimestamp(gameTime),
      message: event.alienMessage,
      type: event.type,
      importance: event.importance || 'minor',
    };

    this.entries.unshift(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this.render();
  }

  /**
   * Add a system message (not from scenario)
   */
  addSystemMessage(message: string): void {
    const entry: FeedEntry = {
      id: `sys-${Date.now()}`,
      timestamp: '',
      message: `> ${message}`,
      type: 'narrative',
      importance: 'minor',
    };

    this.entries.unshift(entry);
    this.render();
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(time: { day: number; hour: number; minute: number }): string {
    const h = time.hour.toString().padStart(2, '0');
    const m = time.minute.toString().padStart(2, '0');
    return `D${time.day} ${h}:${m}`;
  }

  /**
   * Get color based on event type
   */
  private getTypeColor(type: ScenarioEvent['type']): string {
    switch (type) {
      case 'attack':
      case 'destroy':
        return '#ff4444';
      case 'hack':
        return '#00ffff';
      case 'occupy':
        return '#00ff66';
      case 'human_response':
        return '#ffaa00';
      default:
        return '#00cc66';
    }
  }

  /**
   * Get prefix symbol based on event type
   */
  private getTypePrefix(type: ScenarioEvent['type']): string {
    switch (type) {
      case 'attack':
        return '◆';
      case 'destroy':
        return '✖';
      case 'hack':
        return '◇';
      case 'occupy':
        return '▣';
      case 'human_response':
        return '⚠';
      default:
        return '▸';
    }
  }

  /**
   * Render entries to DOM
   */
  private render(): void {
    this.entriesContainer.innerHTML = '';

    for (const entry of this.entries) {
      const entryEl = document.createElement('div');
      entryEl.className = 'alien-feed-entry';
      entryEl.style.cssText = `
        margin-bottom: 6px;
        padding: 4px 0;
        border-bottom: 1px solid rgba(0, 200, 100, 0.1);
        line-height: 1.4;
      `;

      const color = this.getTypeColor(entry.type);
      const prefix = this.getTypePrefix(entry.type);
      const isImportant = entry.importance === 'critical' || entry.importance === 'major';

      entryEl.innerHTML = `
        ${entry.timestamp ? `<span style="color: #446644; margin-right: 8px;">[${entry.timestamp}]</span>` : ''}
        <span style="color: ${color}; margin-right: 4px;">${prefix}</span>
        <span style="color: ${isImportant ? '#ffffff' : '#00cc66'}; ${isImportant ? 'font-weight: bold;' : ''}">${entry.message}</span>
      `;

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
