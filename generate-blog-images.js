#!/usr/bin/env node
/**
 * Blog thumbnail generator using Google Imagen 4
 * Usage: node generate-blog-images.js
 * Requires: IMAGEN_API_KEY in .env
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env manually (no external deps needed)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    });
}

const API_KEY = process.env.IMAGEN_API_KEY;
if (!API_KEY) {
  console.error('Error: IMAGEN_API_KEY not set in .env');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'img', 'blog');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Blog articles and their image prompts
const articles = [
  {
    slug: 'pflegegrad-beantragen-brandenburg',
    prompt:
      'A warm, photorealistic scene of an elderly German woman sitting at a kitchen table with her adult daughter, looking at paperwork together. Natural light, cozy home interior in Brandenburg, Germany. The mood is supportive and calm. No text. Documentary photography style, soft tones.',
  },
  {
    slug: 'was-zahlt-pflegekasse-haeusliche-pflege',
    prompt:
      'A professional female nurse in a white uniform gently assisting an elderly man with morning care in a bright, clean German home. Natural window light, warm and trustworthy atmosphere. No text. Photorealistic, editorial style.',
  },
  {
    slug: 'ambulante-pflege-ludwigsfelde-pflegedienst-finden',
    prompt:
      'A caring female caregiver warmly greeting an elderly couple at the front door of a modest German single-family home. Sunny day, green garden visible. Trust and warmth conveyed. No text. Photorealistic documentary style.',
  },
];

function callImagen(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        safetyFilterLevel: 'block_few',
        personGeneration: 'allow_adult',
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.predictions && json.predictions[0]?.bytesBase64Encoded) {
            resolve(json.predictions[0].bytesBase64Encoded);
          } else {
            reject(new Error(`Unexpected response: ${JSON.stringify(json).slice(0, 300)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generate() {
  for (const article of articles) {
    const outFile = path.join(OUTPUT_DIR, `${article.slug}.jpg`);
    if (fs.existsSync(outFile)) {
      console.log(`  Skipping ${article.slug} (already exists)`);
      continue;
    }
    console.log(`  Generating: ${article.slug}...`);
    try {
      const b64 = await callImagen(article.prompt);
      fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
      console.log(`  Saved: img/blog/${article.slug}.jpg`);
    } catch (err) {
      console.error(`  Failed: ${article.slug} – ${err.message}`);
    }
  }
  console.log('\nDone. Images saved to img/blog/');
}

generate();
