const fs = require("fs");
const path = require("path");

// Simple script to create placeholder PNG icons
const sizes = [16, 48, 128];

// 1x1 blue PNG data
const bluePngData = Buffer.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a, // PNG header
  0x00,
  0x00,
  0x00,
  0x0d,
  0x49,
  0x48,
  0x44,
  0x52, // IHDR chunk
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x02,
  0x00,
  0x00,
  0x00,
  0x90,
  0x77,
  0x53,
  0xde,
  0x00,
  0x00,
  0x00,
  0x0c,
  0x49,
  0x44,
  0x41,
  0x54,
  0x08,
  0xd7,
  0x63,
  0x60,
  0x60,
  0xf8,
  0xcf,
  0x00,
  0x00,
  0x00,
  0x03,
  0x00,
  0x01,
  0x01,
  0xc7,
  0x16,
  0x5d,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4e,
  0x44,
  0xae,
  0x42,
  0x60,
  0x82, // IEND chunk
]);

sizes.forEach((size) => {
  const filename = `dist/extension/icon${size}.png`;
  fs.writeFileSync(filename, bluePngData);
  console.log(`Created ${filename}`);
});

console.log("✅ Icons created");
