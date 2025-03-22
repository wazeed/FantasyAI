const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create the chat-bg directory if it doesn't exist
const bgDir = path.join(__dirname, '../assets/chat-bg');
if (!fs.existsSync(bgDir)) {
  fs.mkdirSync(bgDir, { recursive: true });
}

// Generate gradient backgrounds
function generateGradient(filename, colors) {
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(bgDir, filename), buffer);
}

// Generate pattern backgrounds
function generatePattern(filename, pattern) {
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = pattern.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw pattern
  for (let i = 0; i < pattern.count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = pattern.minSize + Math.random() * (pattern.maxSize - pattern.minSize);
    
    ctx.beginPath();
    if (pattern.shape === 'circle') {
      ctx.arc(x, y, size, 0, Math.PI * 2);
    } else if (pattern.shape === 'star') {
      drawStar(ctx, x, y, 5, size, size/2);
    }
    ctx.fillStyle = pattern.color;
    ctx.fill();
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(bgDir, filename), buffer);
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

// Generate backgrounds
generateGradient('gradient1.png', ['#FF6B6B', '#4ECDC4']); // Sunset theme
generateGradient('gradient2.png', ['#2E3192', '#1BFFFF']); // Ocean theme

generatePattern('pattern1.png', {
  background: '#F8F9FA',
  shape: 'circle',
  color: 'rgba(0,0,0,0.1)',
  count: 100,
  minSize: 10,
  maxSize: 30
}); // Bubbles theme

generatePattern('pattern2.png', {
  background: '#1A1B1E',
  shape: 'star',
  color: 'rgba(255,255,255,0.1)',
  count: 50,
  minSize: 15,
  maxSize: 40
}); // Stars theme

console.log('Chat backgrounds generated successfully!'); 