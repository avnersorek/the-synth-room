/**
 * Utility functions for rendering grid cells
 */

/**
 * Get the beat group class for a column
 * Columns are grouped by 4s for visual distinction
 */
export function getBeatGroupClass(col: number): string {
  const beatGroup = Math.floor(col / 4);
  return `beat-${beatGroup}`;
}

/**
 * Render a grid cell with appropriate classes
 */
export function renderCell(row: number, col: number, additionalClasses: string = ''): string {
  const beatGroupClass = getBeatGroupClass(col);
  return `<div class="cell ${additionalClasses} ${beatGroupClass}" data-row="${row}" data-col="${col}"></div>`;
}

/**
 * Render a row label
 */
export function renderLabel(label: string, additionalClasses: string = ''): string {
  return `<div class="label ${additionalClasses}">${label}</div>`;
}
