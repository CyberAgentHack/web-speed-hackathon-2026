const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Build Verification ===');

// 1. ビルド実行
console.log('1. Running production build...');
try {
  execSync('NODE_ENV=production webpack', { stdio: 'inherit' });
  console.log('✓ Build successful');
} catch (error) {
  console.error('✗ Build failed');
  process.exit(1);
}

// 2. バンドルサイズチェック
console.log('\n2. Checking bundle sizes...');
const distDir = path.join(__dirname, '../dist/scripts');
const files = fs.readdirSync(distDir);

let totalSize = 0;
files.forEach(file => {
  const filePath = path.join(distDir, file);
  const stats = fs.statSync(filePath);
  const sizeInMB = stats.size / (1024 * 1024);
  totalSize += sizeInMB;
  console.log(`  ${file}: ${sizeInMB.toFixed(2)} MB`);
});

console.log(`\nTotal bundle size: ${totalSize.toFixed(2)} MB`);

// 3. 閾値チェック
const MAX_EXPECTED_SIZE = 50; // MB
if (totalSize > MAX_EXPECTED_SIZE) {
  console.warn(`⚠ Warning: Bundle size exceeds ${MAX_EXPECTED_SIZE}MB threshold`);
} else {
  console.log('✓ Bundle size within acceptable range');
}

console.log('\n=== Verification Complete ===');