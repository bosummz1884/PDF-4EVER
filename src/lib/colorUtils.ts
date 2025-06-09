/**
 * Color utility functions for PDF text editing
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 }; // Default to black
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgbNormalized(hex: string): { r: number; g: number; b: number } {
  const { r, g, b } = hexToRgb(hex);
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}

export const commonColors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Dark Gray', hex: '#404040' },
  { name: 'Light Gray', hex: '#C0C0C0' },
  { name: 'Navy', hex: '#000080' },
];