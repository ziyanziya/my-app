export type TheoryDisplayTheme = { background: string; surface: string; accent: string; accentSoft: string; text: string; muted: string };

const themes: TheoryDisplayTheme[] = [
  { background: '#1B0D1D', surface: '#2B1331', accent: '#8E4B5E', accentSoft: '#C2A97E', text: '#EDE2C7', muted: '#C2A97E' },
  { background: '#0F2B2D', surface: '#135D5B', accent: '#C2A97E', accentSoft: '#F2D492', text: '#EDE2C7', muted: '#C2A97E' },
  { background: '#0D1321', surface: '#1E3A5F', accent: '#C2A97E', accentSoft: '#F2D492', text: '#EDE2C7', muted: '#C2A97E' },
  { background: '#2B1E16', surface: '#8B5A2B', accent: '#D4AF37', accentSoft: '#F2D492', text: '#EDE2C7', muted: '#C2A97E' },
  { background: '#1F1F1F', surface: '#3A4A2A', accent: '#C2A97E', accentSoft: '#F2D492', text: '#EDE2C7', muted: '#C2A97E' },
];

export const getTheoryDisplayTheme = (worshipId: string) => {
  const hash = [...worshipId].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 7);
  return themes[hash % themes.length];
};
