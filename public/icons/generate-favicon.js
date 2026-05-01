const { createCanvas } = require('canvas');
const fs = require('fs');

// Create 180x180 for apple-touch-icon
const size = 180;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// White background with rounded corners
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, size, size);

// Blue triangle (scaled from SVG)
ctx.fillStyle = '#0000FE';
ctx.beginPath();
const scale = size / 32;
ctx.moveTo(15.2795 * scale, 3.41699 * scale);
ctx.lineTo(0, 30 * scale);
ctx.quadraticCurveTo(7.51895 * scale, 19.3247 * scale, 16 * scale, 19.3247 * scale);
ctx.quadraticCurveTo(24.4811 * scale, 19.3247 * scale, 32 * scale, 30 * scale);
ctx.lineTo(16.7208 * scale, 3.41699 * scale);
ctx.closePath();
ctx.fill();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('apple-touch-icon.png', buffer);
console.log('Created apple-touch-icon.png');

// Create 32x32 favicon
const canvas32 = createCanvas(32, 32);
const ctx32 = canvas32.getContext('2d');
ctx32.fillStyle = '#ffffff';
ctx32.fillRect(0, 0, 32, 32);
ctx32.fillStyle = '#0000FE';
ctx32.beginPath();
ctx32.moveTo(15.2795, 3.41699);
ctx32.lineTo(0, 30);
ctx32.quadraticCurveTo(7.51895, 19.3247, 16, 19.3247);
ctx32.quadraticCurveTo(24.4811, 19.3247, 32, 30);
ctx32.lineTo(16.7208, 3.41699);
ctx32.closePath();
ctx32.fill();
const buffer32 = canvas32.toBuffer('image/png');
fs.writeFileSync('favicon-32.png', buffer32);
console.log('Created favicon-32.png');
