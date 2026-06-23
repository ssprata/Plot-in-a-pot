// scripts/generate-presets.js
const fs = require('fs');
const path = require('path');

const presetsDir = path.join(__dirname, '..', 'public', 'presets');

// Ensure public/presets directory exists
if (!fs.existsSync(presetsDir)) {
  fs.mkdirSync(presetsDir, { recursive: true });
}

// Read directory contents
try {
  const files = fs.readdirSync(presetsDir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const images = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });

  const manifestPath = path.join(presetsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
  console.log(`[Presets Generator] Successfully generated manifest with ${images.length} images.`);
} catch (err) {
  console.error('[Presets Generator] Error reading presets directory:', err);
}
