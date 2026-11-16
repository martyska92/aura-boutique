const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

async function main() {
  const svgPath = path.resolve(__dirname, "../public/images/brand/aura-logo.svg");
  const pngPath = path.resolve(__dirname, "../public/images/brand/aura-logo.png");

  console.log("Reading SVG from:", svgPath);
  const info = await sharp(svgPath, { density: 300 })
    .resize(986, 354, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);

  console.log("Generated PNG successfully:", info);
}

main().catch((err) => {
  console.error("Error generating logo PNG:", err);
  process.exit(1);
});
