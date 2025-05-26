/**
 * Script to generate icon files for the YouTube Downloader Pro extension
 * Run this with Node.js to create the icon files
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Icon sizes
const sizes = [16, 48, 128];

// Create icons
sizes.forEach(size => {
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(1, '#ff5e00');
  
  // Draw rounded rectangle background
  ctx.fillStyle = gradient;
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw play triangle
  ctx.fillStyle = 'white';
  const triangleSize = size * 0.4;
  const triangleX = size * 0.3;
  const triangleY = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(triangleX, triangleY);
  ctx.lineTo(triangleX, triangleY + triangleSize);
  ctx.lineTo(triangleX + triangleSize, triangleY + triangleSize / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw download arrow
  const arrowWidth = size * 0.1;
  const arrowHeight = size * 0.3;
  const arrowX = size * 0.65;
  const arrowY = size * 0.35;
  
  // Arrow stem
  ctx.fillRect(arrowX - arrowWidth / 2, arrowY, arrowWidth, arrowHeight);
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(arrowX - arrowWidth * 1.5, arrowY + arrowHeight);
  ctx.lineTo(arrowX + arrowWidth * 1.5, arrowY + arrowHeight);
  ctx.lineTo(arrowX, arrowY + arrowHeight * 1.3);
  ctx.closePath();
  ctx.fill();
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  
  console.log(`Created icon${size}.png`);
});

console.log('All icons created successfully!');
