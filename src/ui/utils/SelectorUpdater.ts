/**
 * Utility for updating select elements
 * Reduces duplication between updateKitSelector and updateSynthSelector
 */

export class SelectorUpdater {
  /**
   * Update a selector element with a new value
   * @param container Container element to search within
   * @param selectorId ID of the select element
   * @param value New value to set
   */
  static updateSelector(container: HTMLElement, selectorId: string, value: string): void {
    const selector = container.querySelector(`#${selectorId}`) as HTMLSelectElement;
    if (selector) {
      selector.value = value;
    }
  }
}
