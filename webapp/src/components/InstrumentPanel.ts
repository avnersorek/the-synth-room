import { InstrumentConfig } from '../types';
import { GlowCard } from './GlowCard';

export class InstrumentPanel {
  private glowCards: Map<string, GlowCard>;
  private cleanupPointerTracking?: () => void;
  private scrollContainer?: HTMLElement;
  private instrumentIds: string[] = [];
  private prevButton?: HTMLButtonElement;
  private nextButton?: HTMLButtonElement;

  constructor(
    instruments: InstrumentConfig[],
    getInstrumentContent: (instrumentId: string) => string
  ) {
    this.glowCards = new Map();

    // Create GlowCard instances for each instrument with content
    instruments.forEach(instrument => {
      this.instrumentIds.push(instrument.id);
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
        <button class="nav-button nav-button-left" id="nav-prev" aria-label="Previous instrument">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="instrument-scroll-container">
          ${cardsHtml}
        </div>
        <button class="nav-button nav-button-right" id="nav-next" aria-label="Next instrument">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  attachEvents(container: HTMLElement) {
    // Setup pointer tracking for glow effect
    this.scrollContainer = container.querySelector('.instrument-scroll-container') as HTMLElement;
    if (this.scrollContainer) {
      this.cleanupPointerTracking = GlowCard.attachPointerTracking(this.scrollContainer);
    }

    // Setup navigation button handlers
    this.prevButton = container.querySelector('#nav-prev') as HTMLButtonElement;
    this.nextButton = container.querySelector('#nav-next') as HTMLButtonElement;

    if (this.prevButton && this.scrollContainer) {
      this.prevButton.addEventListener('click', () => this.scrollToPrev());
    }

    if (this.nextButton && this.scrollContainer) {
      this.nextButton.addEventListener('click', () => this.scrollToNext());
    }

    // Setup scroll listener to update button visibility
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', () => this.updateButtonVisibility());
      // Initial update
      this.updateButtonVisibility();
    }
  }

  private scrollToPrev() {
    if (!this.scrollContainer) {
      return;
    }

    const cardWidth = this.scrollContainer.querySelector('.instrument-card-wrapper')?.getBoundingClientRect().width || 0;
    const scrollLeft = this.scrollContainer.scrollLeft;
    const targetScroll = Math.max(0, scrollLeft - cardWidth - 48); // 48 is gap

    this.scrollContainer.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  private scrollToNext() {
    if (!this.scrollContainer) {
      return;
    }

    const cardWrapper = this.scrollContainer.querySelector('.instrument-card-wrapper') as HTMLElement;
    const cardWidth = cardWrapper?.getBoundingClientRect().width || 0;
    const scrollLeft = this.scrollContainer.scrollLeft;
    const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
    const targetScroll = Math.min(maxScroll, scrollLeft + cardWidth + 48); // 48 is gap

    this.scrollContainer.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  private updateButtonVisibility() {
    if (!this.scrollContainer || !this.prevButton || !this.nextButton) {
      return;
    }

    const scrollLeft = this.scrollContainer.scrollLeft;
    const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
    const tolerance = 20; // Tolerance for rounding errors

    // Hide prev button if at the start (first instrument visible)
    if (scrollLeft <= tolerance) {
      this.prevButton.style.display = 'none';
    } else {
      this.prevButton.style.display = 'flex';
    }

    // Hide next button if at the end (last instrument visible)
    if (scrollLeft >= maxScroll - tolerance) {
      this.nextButton.style.display = 'none';
    } else {
      this.nextButton.style.display = 'flex';
    }
  }

  destroy() {
    // Cleanup pointer tracking
    if (this.cleanupPointerTracking) {
      this.cleanupPointerTracking();
    }
  }
}
