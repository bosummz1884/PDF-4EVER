/**
 * Attempt to match a target font name against a fallback list
 * @param {string} targetName
 * @param {string[]} availableFonts
 * @returns {string}
 */
export function matchFont(targetName, availableFonts) {
  const lower = targetName.toLowerCase();
  const match = availableFonts.find(f => f.toLowerCase().includes(lower));
  return match || 'Helvetica';
}

/**
 * Get system fonts available for PDF editing
 * @returns {string[]}
 */
export function getAvailableFonts() {
  return [
    'Helvetica',
    'Times-Roman',
    'Courier',
    'Arial',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Comic Sans MS',
    'Impact',
    'Lucida Console'
  ];
}

/**
 * Get font weight from style name
 * @param {string} styleName
 * @returns {number}
 */
export function getFontWeight(styleName) {
  const style = styleName.toLowerCase();
  if (style.includes('bold')) return 700;
  if (style.includes('light')) return 300;
  if (style.includes('medium')) return 500;
  return 400;
}