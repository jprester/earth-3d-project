/**
 * Toast notification system for game events
 */

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  createdAt: number;
  element: HTMLDivElement;
}

const TYPE_COLORS: Record<Notification['type'], { bg: string; border: string; icon: string }> = {
  info: { bg: 'rgba(0, 100, 200, 0.9)', border: '#0088ff', icon: 'ℹ' },
  success: { bg: 'rgba(0, 150, 50, 0.9)', border: '#00cc44', icon: '✓' },
  warning: { bg: 'rgba(200, 150, 0, 0.9)', border: '#ffaa00', icon: '⚠' },
  error: { bg: 'rgba(200, 50, 50, 0.9)', border: '#ff4444', icon: '✕' },
};

const DEFAULT_DURATION = 4000;

export class NotificationSystem {
  private container: HTMLDivElement;
  private notifications: Map<string, Notification>;
  private idCounter: number = 0;

  constructor() {
    this.notifications = new Map();

    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
      pointer-events: none;
      max-width: 350px;
    `;
  }

  /**
   * Show a notification
   */
  show(
    message: string,
    type: Notification['type'] = 'info',
    duration: number = DEFAULT_DURATION
  ): string {
    const id = `notification_${++this.idCounter}`;
    const colors = TYPE_COLORS[type];

    const element = document.createElement('div');
    element.className = 'notification';
    element.style.cssText = `
      background: ${colors.bg};
      border: 1px solid ${colors.border};
      border-radius: 6px;
      padding: 12px 16px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #fff;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(120%);
      transition: transform 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    `;

    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = `
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    `;
    iconSpan.textContent = colors.icon;

    const messageSpan = document.createElement('span');
    messageSpan.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    messageSpan.textContent = message;

    element.appendChild(iconSpan);
    element.appendChild(messageSpan);

    // Click to dismiss
    element.onclick = () => this.dismiss(id);

    this.container.appendChild(element);

    const notification: Notification = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
      element,
    };

    this.notifications.set(id, notification);

    // Animate in
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });

    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Animate out
    notification.element.style.transform = 'translateX(120%)';
    notification.element.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (notification.element.parentElement) {
        notification.element.parentElement.removeChild(notification.element);
      }
      this.notifications.delete(notificationId);
    }, 300);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }

  /**
   * Append to DOM
   */
  appendTo(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  /**
   * Remove from DOM
   */
  remove(): void {
    this.clearAll();
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
