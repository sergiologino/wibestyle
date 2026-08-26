import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const GARNIER_ORIGIN = "https://www.garnier.ru";
const CATALOG_URLS = [
  `${GARNIER_ORIGIN}/hair-color/beauty/garnier`,
  `${GARNIER_ORIGIN}/hair-color/beauty/garnier/color-sensation-series`,
  `${GARNIER_ORIGIN}/hair-color/beauty/garnier/color-naturals-series`,
  `${GARNIER_ORIGIN}/hair-color/beauty/garnier/olia`,
];
const MAX_COLORS = Number(process.env.GARNIER_HAIR_COLOR_LIMIT || 40);
const MIN_COLORS = Number(process.env.GARNIER_HAIR_COLOR_MIN || 27);

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const storageRoot = process.env.WIBESTYLE_STORAGE_ROOT || join(root, "data", "storage");
const outDir = join(storageRoot, "catalog", "hair-colors");

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&nbsp;", " ");
}

function absoluteGarnierUrl(path) {
  return path.startsWith("http") ? path : `${GARNIER_ORIGIN}/${path.replace(/^\/?/, "")}`;
}

function slugFromProductPath(path) {
  return path.split("/").filter(Boolean).at(-1);
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return decodeHtml(await response.text());
}

async function fetchBytes(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function extractCatalogProductPaths(html) {
  return [...new Set(
    [...html.matchAll(/"url":"(\/hair-color\/beauty\/garnier\/(?:color-sensation|color-naturals|olia)\/[^"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => !path.endsWith("-series")),
  )];
}

function extractPrimaryHairTexture(pageHtml) {
  const media = [...new Set(
    [...pageHtml.matchAll(/(?:https:\/\/www\.garnier\.ru)?\/?-\/media\/[^\\"\s]+/g)]
      .map((match) => match[0]),
  )];
  return media.filter((url) => /_t[234]\.(jpe?g|png|webp)\?rev=/i.test(url) && !url.includes("?w="));
}

export async function whiteBackgroundRatio(bytes) {
  const { data, info } = await sharp(bytes)
    .resize(80, 80, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let white = 0;
  const pixels = data.length / info.channels;
  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    if (r > 235 && g > 235 && b > 235) white += 1;
  }
  return white / pixels;
}

async function normalizeHairTexture(bytes) {
  return sharp(bytes)
    .resize(1000, 1000, { fit: "cover" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export async function isLikelyHairTexture(bytes) {
  return (await whiteBackgroundRatio(bytes)) <= 0.08;
}

async function chooseHairTexture(candidatePaths) {
  for (const candidatePath of candidatePaths) {
    const imageUrl = absoluteGarnierUrl(candidatePath);
    const bytes = await fetchBytes(imageUrl);
    if (!(await isLikelyHairTexture(bytes))) {
      const whiteRatio = await whiteBackgroundRatio(bytes);
      console.warn(`Skipping non-texture image (${whiteRatio.toFixed(2)} white): ${imageUrl}`);
      continue;
    }
    return { imageUrl, bytes: await normalizeHairTexture(bytes) };
  }
  return null;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const productPaths = [];
  const seenProductPaths = new Set();
  for (const catalogUrl of CATALOG_URLS) {
    const catalogHtml = await fetchText(catalogUrl);
    for (const productPath of extractCatalogProductPaths(catalogHtml)) {
      if (seenProductPaths.has(productPath)) continue;
      seenProductPaths.add(productPath);
      productPaths.push(productPath);
    }
  }

  let downloaded = 0;
  const downloadedSlugs = new Set();

  for (const productPath of productPaths) {
    const slug = slugFromProductPath(productPath);
    if (downloadedSlugs.has(slug)) continue;
    const pageHtml = await fetchText(absoluteGarnierUrl(productPath));
    const texture = await chooseHairTexture(extractPrimaryHairTexture(pageHtml));
    if (!texture) {
      console.warn(`Skipping color without full hair texture: ${productPath}`);
      continue;
    }

    const file = join(outDir, `${slug}.jpg`);
    await writeFile(file, texture.bytes);
    downloadedSlugs.add(slug);
    downloaded += 1;
    console.log(`${slug} -> ${file} (${texture.imageUrl})`);
    if (downloaded >= MAX_COLORS) break;
  }

  if (downloaded < MIN_COLORS) {
    throw new Error(`Expected at least ${MIN_COLORS} Garnier hair color textures, downloaded ${downloaded}`);
  }

  console.log(`Downloaded ${downloaded} Garnier hair color previews to ${outDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
