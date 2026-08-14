const fs = require('fs');
const { PNG } = require('pngjs');

const source = process.argv[2];
const pngOutput = 'assets/images/auth/elsirat-logo-transparent.png';
const svgOutput = 'assets/images/auth/elsirat-logo-transparent.svg';

if (!source || !fs.existsSync(source)) {
  throw new Error('Pass the original logo PNG path as the first argument.');
}

const input = PNG.sync.read(fs.readFileSync(source));
const pixels = input.width * input.height;
const background = new Uint8Array(pixels);
const queued = new Uint8Array(pixels);
const queue = [];

function isBurgundyBackground(offset) {
  const red = input.data[offset];
  const green = input.data[offset + 1];
  const blue = input.data[offset + 2];
  // The external backdrop is dark burgundy. Gold strokes have much more green
  // and are deliberately excluded so their highlights and anti-aliased edges stay intact.
  return red < 128 && green < 58 && blue < 58 && red > green * 1.45 && red > blue * 1.15;
}

function enqueue(index) {
  if (queued[index] || !isBurgundyBackground(index * 4)) return;
  queued[index] = 1;
  queue.push(index);
}

for (let x = 0; x < input.width; x += 1) {
  enqueue(x);
  enqueue((input.height - 1) * input.width + x);
}
for (let y = 1; y < input.height - 1; y += 1) {
  enqueue(y * input.width);
  enqueue(y * input.width + input.width - 1);
}

for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const index = queue[cursor];
  background[index] = 1;
  const x = index % input.width;
  const y = Math.floor(index / input.width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < input.width) enqueue(index + 1);
  if (y > 0) enqueue(index - input.width);
  if (y + 1 < input.height) enqueue(index + input.width);
}

const output = new PNG({ width: input.width, height: input.height });
for (let index = 0; index < pixels; index += 1) {
  const offset = index * 4;
  output.data[offset] = input.data[offset];
  output.data[offset + 1] = input.data[offset + 1];
  output.data[offset + 2] = input.data[offset + 2];
  output.data[offset + 3] = background[index] ? 0 : input.data[offset + 3];
}

const transparentPng = PNG.sync.write(output);
fs.writeFileSync(pngOutput, transparentPng);

// SVG container keeps the full-resolution original artwork and alpha channel.
const base64 = transparentPng.toString('base64');
fs.writeFileSync(svgOutput, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">\n  <image width="${input.width}" height="${input.height}" href="data:image/png;base64,${base64}"/>\n</svg>\n`);

console.log(`Created ${pngOutput} and ${svgOutput}`);
