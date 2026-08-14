const fs = require('fs');

const logoPath = 'assets/images/auth/elsirat-logo-transparent.svg';
const markerStart = '<!-- bottom-lantern-replacement:start -->';
const markerEnd = '<!-- bottom-lantern-replacement:end -->';
let svg = fs.readFileSync(logoPath, 'utf8');

const previous = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\s*`, 'g');
svg = svg.replace(previous, '');

const replacement = `
${markerStart}
  <defs>
    <linearGradient id="lanternGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff4ab"/>
      <stop offset=".28" stop-color="#ffd45f"/>
      <stop offset=".62" stop-color="#b76a0b"/>
      <stop offset="1" stop-color="#ffce50"/>
    </linearGradient>
    <filter id="lanternGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur"/>
      <feFlood flood-color="#f6b93b" flood-opacity=".72" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g id="bottom-lantern-replacement">
    <!-- A dark medallion cleanly hides the former lower ornament while retaining the surrounding artwork. -->
    <circle cx="627" cy="950" r="70" fill="#3b050d" fill-opacity=".96" stroke="#6b210d" stroke-width="3"/>
    <g fill="none" stroke="url(#lanternGold)" stroke-linejoin="round" stroke-linecap="round" filter="url(#lanternGlow)">
      <path d="M615 912v-7c0-16 24-16 24 0v7" stroke-width="5"/>
      <path d="M609 918h36l-5 11h-26z" stroke-width="5" fill="url(#lanternGold)"/>
      <path d="M611 932h32l7 11-7 51h-32l-7-51z" stroke-width="5" fill="#7b270d"/>
      <path d="M618 939v47M636 939v47" stroke-width="3.5"/>
      <path d="M610 996h34l-5 10h-24z" stroke-width="5" fill="url(#lanternGold)"/>
      <path d="M627 1006v13" stroke-width="4"/>
      <circle cx="627" cy="962" r="9" fill="#fff0a2" stroke="none"/>
    </g>
  </g>
${markerEnd}
`;

if (!svg.includes('</svg>')) throw new Error('Invalid SVG: closing tag not found.');
svg = svg.replace('</svg>', `${replacement}</svg>`);
fs.writeFileSync(logoPath, svg, 'utf8');
console.log('Replaced the lower ornament with a gold lantern.');
