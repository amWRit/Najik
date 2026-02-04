const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '..', 'public', 'images', 'logos', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public', 'images', 'logos');

async function generateIcons() {
  console.log('🎨 Generating PNG icons from SVG...\n');

  // Read SVG file
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // Create data URL for the SVG
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  for (const size of sizes) {
    try {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Load and draw the SVG
      const img = await loadImage(svgDataUrl);
      ctx.drawImage(img, 0, 0, size, size);

      // Save as PNG
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // Generate apple-touch-icon (180x180)
  try {
    const canvas = createCanvas(180, 180);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, 180, 180);
    const outputPath = path.join(outputDir, 'apple-touch-icon.png');
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log('✅ Generated: apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Failed to generate apple-touch-icon:', error.message);
  }

  // Generate favicon (32x32)
  try {
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, 32, 32);
    const outputPath = path.join(__dirname, '..', 'public', 'favicon.png');
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log('✅ Generated: favicon.png');
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error.message);
  }

  console.log('\n✨ Icon generation complete!');
}

generateIcons().catch(console.error);
