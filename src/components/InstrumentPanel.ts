import { InstrumentConfig } from '../types';
import { GlowCard } from './GlowCard';

export class InstrumentPanel {
  private instruments: InstrumentConfig[];
  private activeInstrumentId: string;
  private onChange: (instrumentId: string) => void;
  private glowCards: Map<string, GlowCard>;
  private cleanupPointerTracking?: () => void;
  private getInstrumentContent?: (instrumentId: string) => string;

  constructor(
    instruments: InstrumentConfig[],
    activeId: string,
    onChange: (instrumentId: string) => void,
    getInstrumentContent?: (instrumentId: string) => string
  ) {
    this.instruments = instruments;
    this.activeInstrumentId = activeId;
    this.onChange = onChange;
    this.getInstrumentContent = getInstrumentContent;
    this.glowCards = new Map();

    // Create GlowCard instances for each instrument
    instruments.forEach(instrument => {
      const isActive = instrument.id === activeId;
      // Always show content for drums, show content for active instrument
      const content = getInstrumentContent && (instrument.id === 'drums' || isActive)
        ? getInstrumentContent(instrument.id)
        : '';

      const card = new GlowCard({
        instrumentId: instrument.id,
        title: instrument.name,
        isActive,
        content
      });
      this.glowCards.set(instrument.id, card);
    });
  }

  render(): string {
    const cardsHtml = this.instruments
      .map(instrument => {
        const card = this.glowCards.get(instrument.id)!;
        return card.render();
      })
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

    // Setup click handlers for instrument cards
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const wrapper = target.closest('.instrument-card-wrapper') as HTMLElement;

      if (wrapper) {
        const instrumentId = wrapper.dataset.instrumentId;
        if (instrumentId && instrumentId !== this.activeInstrumentId) {
          this.onChange(instrumentId);
        }
      }
    });
  }

  updateActiveCard(instrumentId: string) {
    this.activeInstrumentId = instrumentId;

    // Update the active state and content for all cards
    this.glowCards.forEach((card, id) => {
      const isActive = id === instrumentId;
      card.setActive(isActive);

      // Always show content for drums, show content for active instrument
      if (this.getInstrumentContent && (id === 'drums' || isActive)) {
        card.updateContent(this.getInstrumentContent(id));
      } else {
        card.updateContent('');
      }
    });

    // Re-render the entire panel with updated content
    const container = document.querySelector('.instrument-selector');
    if (container) {
      container.innerHTML = this.render();
      this.attachEvents(container.parentElement as HTMLElement);

      // Scroll to the active card
      setTimeout(() => {
        const activeCard = document.querySelector(`[data-instrument-id="${instrumentId}"]`);
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  }

  destroy() {
    // Cleanup pointer tracking event listener
    if (this.cleanupPointerTracking) {
      this.cleanupPointerTracking();
    }
  }
}
