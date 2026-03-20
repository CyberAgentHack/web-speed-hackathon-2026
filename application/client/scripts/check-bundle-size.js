const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../../dist/scripts');
if (!fs.existsSync(distDir)) {
  console.error('dist/scripts directory does not exist. Run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);

console.log('Bundle size report:');
let totalSize = 0;
files.forEach(file => {
  const filePath = path.join(distDir, file);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  totalSize += stats.size;
  console.log(`${file}: ${sizeInMB} MB`);
});

const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`\nTotal bundle size: ${totalSizeInMB} MB`);

// 閾値チェック
const MAX_EXPECTED_SIZE = 50; // MB
if (totalSize > MAX_EXPECTED_SIZE * 1024 * 1024) {
  console.warn(`⚠ Warning: Bundle size exceeds ${MAX_EXPECTED_SIZE}MB threshold`);
} else {
  console.log('✓ Bundle size within acceptable range');
}