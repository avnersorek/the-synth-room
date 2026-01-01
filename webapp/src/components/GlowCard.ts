export interface GlowCardConfig {
  instrumentId: string;
  title: string;
  content: string;
}

export class GlowCard {
  private instrumentId: string;
  private title: string;
  private content: string;

  constructor(config: GlowCardConfig) {
    this.instrumentId = config.instrumentId;
    this.title = config.title;
    this.content = config.content;
  }

  render(): string {
    return `
      <div class="instrument-card-wrapper" data-instrument-id="${this.instrumentId}">
        <div class="instrument-card active" data-glow data-instrument="${this.instrumentId}">
          <div class="instrument-card-header">
            <h2>${this.title}</h2>
          </div>
          <div class="instrument-card-content">${this.content}</div>
        </div>
      </div>
    `;
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
