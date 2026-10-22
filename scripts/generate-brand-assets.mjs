import sharp from "sharp";

const bars = [0, 5.4, 10.8, 16.2, 21.6, 27]
  .map((x, index) => {
    const heights = [19, 23, 27, 24, 21, 17];
    return `<rect x="${x}" y="${30 - heights[index]}" width="3.2" height="${heights[index]}" fill="#045091"/>`;
  })
  .join("");

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#EEF2F1"/>
  <rect width="1200" height="14" fill="#045091"/>
  <g transform="translate(72, 92) scale(4.2)">${bars}</g>
  <text x="72" y="300" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="700" letter-spacing="9" fill="#061522">FERNAS</text>
  <text x="76" y="348" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="400" letter-spacing="8" fill="#586B76">ŞİRKETLER GRUBU</text>
  <line x1="72" y1="412" x2="1128" y2="412" stroke="#586B76" stroke-opacity="0.35" stroke-width="2"/>
  <text x="72" y="500" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" letter-spacing="-2" fill="#061522">One group. Six disciplines.</text>
  <text x="72" y="556" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="2" fill="#586B76">SINCE 1982 · ANKARA</text>
  <rect x="1010" y="470" width="118" height="118" fill="#045091"/>
  <text x="1069" y="556" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#FFFFFF">F</text>
</svg>`;

await sharp(Buffer.from(ogSvg)).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile("public/og-default.jpg");

const iconSvg = `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="24" fill="#045091"/>
  <g transform="translate(46, 50) scale(1.55)" fill="#FFFFFF">${bars}</g>
  <text x="90" y="148" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="2" fill="#FFFFFF">FERNAS</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile("public/apple-touch-icon.png");

console.log("Generated public/og-default.jpg and public/apple-touch-icon.png");
