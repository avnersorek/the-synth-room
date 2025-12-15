export interface GlowCardConfig {
  instrumentId: string;
  title: string;
  isActive: boolean;
  content?: string; // Optional HTML content to render inside the card
}

export class GlowCard {
  private instrumentId: string;
  private title: string;
  private isActive: boolean;
  private content: string;

  constructor(config: GlowCardConfig) {
    this.instrumentId = config.instrumentId;
    this.title = config.title;
    this.isActive = config.isActive;
    this.content = config.content || '';
  }

  render(): string {
    const activeClass = this.isActive ? 'active' : '';
    return `
      <div class="instrument-card-wrapper" data-instrument-id="${this.instrumentId}">
        <div class="instrument-card ${activeClass}" data-glow data-instrument="${this.instrumentId}">
          <div class="instrument-card-header">
            <h2>${this.title}</h2>
          </div>
          ${this.content ? `<div class="instrument-card-content">${this.content}</div>` : ''}
        </div>
      </div>
    `;
  }

  updateContent(content: string) {
    this.content = content;
  }

  setActive(active: boolean) {
    this.isActive = active;
  }

  /**
   * Attaches pointer tracking to update CSS custom properties for glow effect
   * This should be called after the element is rendered in the DOM
   */
  static attachPointerTracking(container: HTMLElement) {
    const syncPointer = (e: PointerEvent) => {
      // Get pointer position relative to viewport
      const x = e.clientX;
      const y = e.clientY;

      // Update CSS custom properties on document root for fixed background positioning
      document.documentElement.style.setProperty('--px', x.toFixed(2));
      document.documentElement.style.setProperty('--py', y.toFixed(2));
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);
    };

    container.addEventListener('pointermove', syncPointer);

    // Return cleanup function
    return () => {
      container.removeEventListener('pointermove', syncPointer);
    };
  }
}
