import sharp from "sharp";

const input = "public/master.png";

async function run() {
  // Regular icons
  await sharp(input).resize(192, 192).png().toFile("public/icon-192.png");

  await sharp(input).resize(512, 512).png().toFile("public/icon-512.png");

  // Maskable icons (with padding)
  await sharp(input)
    .resize(384, 384)
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: "#ffffff",
    })
    .png()
    .toFile("public/icon-512-maskable.png");

  await sharp(input)
    .resize(144, 144)
    .extend({
      top: 24,
      bottom: 24,
      left: 24,
      right: 24,
      background: "#ffffff",
    })
    .png()
    .toFile("public/icon-192-maskable.png");

  console.log("✅ Icons generated");
}

run();
