const fs = require('fs');

const logoPath = 'assets/images/auth/elsirat-logo-transparent.svg';
const lanternStart = '<!-- bottom-lantern-replacement:start -->';
const lanternEnd = '<!-- bottom-lantern-replacement:end -->';
const maskStart = '<!-- bottom-ornament-mask:start -->';
const maskEnd = '<!-- bottom-ornament-mask:end -->';
let svg = fs.readFileSync(logoPath, 'utf8');

svg = svg.replace(new RegExp(`${lanternStart}[\\s\\S]*?${lanternEnd}\\s*`, 'g'), '');
svg = svg.replace(new RegExp(`${maskStart}[\\s\\S]*?${maskEnd}\\s*`, 'g'), '');

const mask = `
${maskStart}
  <!-- Clean burgundy panel that removes the former star and the two adjacent lines. -->
  <path d="M342 855H912V1012C835 1047 738 1075 627 1108C516 1075 419 1047 342 1012Z" fill="#38050d"/>
${maskEnd}
`;

svg = svg.replace('</svg>', `${mask}</svg>`);
fs.writeFileSync(logoPath, svg, 'utf8');
console.log('Removed the lower star, side lines, and temporary lantern.');
