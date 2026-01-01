import { InstrumentConfig } from '../types';
import { GlowCard } from './GlowCard';

export class InstrumentPanel {
  private glowCards: Map<string, GlowCard>;
  private cleanupPointerTracking?: () => void;

  constructor(
    instruments: InstrumentConfig[],
    getInstrumentContent: (instrumentId: string) => string
  ) {
    this.glowCards = new Map();

    // Create GlowCard instances for each instrument with content
    instruments.forEach(instrument => {
      const content = getInstrumentContent(instrument.id);

      const card = new GlowCard({
        instrumentId: instrument.id,
        title: instrument.name,
        content
      });
      this.glowCards.set(instrument.id, card);
    });
  }

  render(): string {
    const cardsHtml = Array.from(this.glowCards.values())
      .map(card => card.render())
      .join('');

    return `
      <div class="instrument-selector">
        <div class="instrument-scroll-container">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  attachEvents(container: HTMLElement) {
    // Setup pointer tracking for glow effect
    const scrollContainer = container.querySelector('.instrument-scroll-container') as HTMLElement;
    if (scrollContainer) {
      this.cleanupPointerTracking = GlowCard.attachPointerTracking(scrollContainer);
    }
  }

  destroy() {
    // Cleanup pointer tracking
    if (this.cleanupPointerTracking) {
      this.cleanupPointerTracking();
    }
  }
}
