const fs = require('fs');
const path = require('path');

// Create a very small valid transparent 1x1 PNG as a placeholder
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64Png, 'base64');

const assets = [
  'icon.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'favicon.png'
];

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

assets.forEach(file => {
  fs.writeFileSync(path.join(assetsDir, file), buffer);
  console.log(`Created placeholder: ${file}`);
});
