import fse from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import sharp from 'sharp';
import type { GameDesignSnapshot } from './snapshot.js';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const ENGINE_ID = 'stable-diffusion-xl-1024-v1-1';
const API_HOST = 'https://api.stability.ai';

async function generateStabilityImage(prompt: string, color: string): Promise<Buffer | null> {
  if (!STABILITY_API_KEY) return null;

  try {
    const response = await fetch(
      `${API_HOST}/v1/generation/${ENGINE_ID}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: `${prompt}, game asset, centered, full view, flat background color #ff00ff, high quality, ${color} theme`,
              weight: 1,
            },
            {
              text: "blurry, distorted, low quality, multiple objects, complex background, gradient background",
              weight: -1,
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    const responseJSON = (await response.json()) as any;
    const imageBase64 = responseJSON.artifacts[0].base64;
    return Buffer.from(imageBase64, 'base64');
  } catch (err) {
    console.error(chalk.yellow('   ⚠️ Stability AI failed:'), err);
    return null;
  }
}

async function removeMagentaBackground(imageBuffer: Buffer): Promise<Buffer> {
  // Use sharp to make #ff00ff (magenta) transparent
  // We look for pixels where R is high, G is low, B is high
  return sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height, channels } = info;
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Match magenta (#ff00ff) with some tolerance
        if (r > 200 && g < 100 && b > 200) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }
      return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
    });
}

export async function generateAssets(snapshot: GameDesignSnapshot, targetDir: string) {
  const assetsDir = path.join(targetDir, 'assets');
  await fse.ensureDir(assetsDir);

  console.log(chalk.blue('   🎨 Generating high-fidelity assets (Stability AI)...'));

  const assetSpecs: { key: string; prompt: string }[] = [];
  
  if (snapshot.genre === 'runner') {
    assetSpecs.push(
      { key: 'player', prompt: `character for an endless runner, ${snapshot.vibe} style` },
      { key: 'obstacle', prompt: `dangerous hazard or obstacle, ${snapshot.vibe} style` }
    );
  } else if (snapshot.genre === 'arena') {
    assetSpecs.push(
      { key: 'player', prompt: `top-down perspective hero character, ${snapshot.vibe} style` },
      { key: 'enemy', prompt: `top-down perspective hostile alien or robot, ${snapshot.vibe} style` },
      { key: 'bullet', prompt: `glowing projectile or energy bolt, ${snapshot.vibe} style` }
    );
  } else if (snapshot.genre === 'puzzle') {
    assetSpecs.push({ key: 'piece', prompt: `crystal or gem game piece, ${snapshot.vibe} style` });
  }

  for (const spec of assetSpecs) {
    let finalImage: Buffer | null = null;
    
    if (STABILITY_API_KEY) {
      console.log(chalk.dim(`      → Generating ${spec.key}...`));
      const rawBuffer = await generateStabilityImage(spec.prompt, snapshot.colorPalette.primary);
      if (rawBuffer) {
        finalImage = await removeMagentaBackground(rawBuffer);
      }
    }

    if (finalImage) {
      await fse.writeFile(path.join(assetsDir, `${spec.key}.png`), finalImage);
    } else {
      // Fallback to SVG if AI fails or no key
      const color = snapshot.colorPalette.primary;
      const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="${color}" rx="8" />
        <circle cx="45" cy="20" r="5" fill="white" />
        <circle cx="47" cy="20" r="2" fill="black" />
      </svg>`;
      await fse.writeFile(path.join(assetsDir, `${spec.key}.svg`), svg);
    }
  }
}
