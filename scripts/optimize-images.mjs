#!/usr/bin/env node
/**
 * Fernas image pipeline.
 *
 * Downloads referenced source images (only ones used by projects/news/sectors),
 * writes 800/1600 px WebP derivatives and updates content JSON paths.
 *
 * Output layout:
 *   public/images/projects/<slug>/cover-800.webp
 *   public/images/projects/<slug>/cover-1600.webp
 *   public/images/projects/<slug>/gallery-01-800.webp
 *   public/images/projects/<slug>/gallery-01-1600.webp
 *   public/images/news/<slug>/cover-800.webp
 *   public/images/news/<slug>/cover-1600.webp
 *   public/images/sectors/<slug>.webp
 *
 * Usage:
 *   node scripts/optimize-images.mjs [--force]
 *
 * Called from scripts/import-wordpress.mjs via runImagePipeline().
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const BASE = 'https://www.fernas.com.tr';
const UA = 'FernasSiteRebuild/1.0 (+https://www.fernas.com.tr)';
const TIMEOUT_MS = 30_000;
const QUALITY = 82;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        out[i] = await fn(items[i], i);
      } catch (error) {
        out[i] = { __error: error.message, item: items[i] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function extFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.tif', '.tiff'].includes(ext)) return ext;
  } catch {
    // ignore
  }
  return '.img';
}

async function download(url, cacheDir, { log } = {}) {
  if (!url) return { ok: false, error: 'empty url' };
  const hash = crypto.createHash('sha1').update(url).digest('hex');
  const cacheFile = path.join(cacheDir, `${hash}.bin`);
  try {
    const buffer = await fs.readFile(cacheFile);
    if (buffer.length > 0) return { ok: true, buffer, cacheFile, cached: true };
  } catch {
    // no cache
  }

  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status >= 500 && attempt < 3) throw new Error(lastError);
        return { ok: false, error: lastError };
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (!buffer.length) return { ok: false, error: 'empty body' };
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cacheFile, buffer);
      return { ok: true, buffer, cacheFile, cached: false };
    } catch (error) {
      lastError = error?.message || String(error);
      if (attempt < 3) await sleep(700 * attempt * attempt);
    }
  }
  return { ok: false, error: lastError };
}

async function outputWebp(buffer, outFile, width) {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await sharp(buffer, { failOn: 'none', animated: false })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(outFile);
}

async function emitSizes(buffer, outDir, baseName, widths = [800, 1600]) {
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const sourceWidth = meta.width || 0;
  const sourceHeight = meta.height || 0;
  const outputs = {};
  for (const width of widths) {
    const file = path.join(outDir, `${baseName}-${width}.webp`);
    await outputWebp(buffer, file, width);
    outputs[width] = file;
  }
  return {
    sourceWidth,
    sourceHeight,
    lowRes: sourceWidth > 0 && sourceWidth < 800,
    outputs,
  };
}

function publicPath(root, file) {
  return `/${path.relative(path.join(root, 'public'), file).split(path.sep).join('/')}`;
}

export async function runImagePipeline({ root = process.cwd(), log = () => {}, force = false } = {}) {
  const rawDir = path.join(root, 'data/raw');
  const cacheDir = path.join(rawDir, 'media');
  const publicDir = path.join(root, 'public/images');
  await fs.mkdir(cacheDir, { recursive: true });

  const portfolioRaw = await readJson(path.join(rawDir, 'portfolio.json'), { canonical: [] });
  const postsRaw = await readJson(path.join(rawDir, 'posts.json'), { posts: [] });
  const sectorsRaw = await readJson(path.join(rawDir, 'sectors.json'), { sectors: [] });

  const media = [];
  const lowRes = [];
  let downloaded = 0;
  let written = 0;
  let failed = 0;

  const updateProject = async (slug, updater) => {
    const file = path.join(root, 'src/content/projects', `${slug}.json`);
    const json = await readJson(file, null);
    if (!json) return;
    updater(json);
    await writeJson(file, json);
  };
  const updateNews = async (slug, updater) => {
    const file = path.join(root, 'src/content/news', `${slug}.json`);
    const json = await readJson(file, null);
    if (!json) return;
    updater(json);
    await writeJson(file, json);
  };

  // --- projects ---------------------------------------------------------
  const projects = (portfolioRaw.canonical || []).filter((item) => item && item.slug);
  log(`Images: ${projects.length} projects`);

  await mapLimit(projects, 4, async (project, index) => {
    const { slug } = project;
    const coverUrl = project.cover_source || '';
    const galleryUrls = [...new Set((project.gallery_sources || []).filter((url) => url && url !== coverUrl))].slice(0, 6);

    let coverUpdate = null;
    let galleryPublic = [];
    let projectLowRes = false;

    if (coverUrl) {
      const dl = await download(coverUrl, cacheDir, { log });
      if (dl.ok) {
        if (!dl.cached) downloaded++;
        try {
          const outDir = path.join(publicDir, 'projects', slug);
          const result = await emitSizes(dl.buffer, outDir, 'cover');
          written += Object.keys(result.outputs).length;
          coverUpdate = publicPath(root, result.outputs[1600]);
          projectLowRes = result.lowRes;
          const record = {
            owner_type: 'project',
            owner_slug: slug,
            role: 'cover',
            source_url: coverUrl,
            width: result.sourceWidth,
            height: result.sourceHeight,
            low_res: result.lowRes,
            outputs: Object.values(result.outputs).map((file) => publicPath(root, file)),
            status: 'ok',
          };
          media.push(record);
          if (result.lowRes) lowRes.push({ slug, width: result.sourceWidth, url: coverUrl, role: 'cover' });
        } catch (error) {
          failed++;
          log(`  ! ${slug} cover: ${error.message}`);
          media.push({ owner_type: 'project', owner_slug: slug, role: 'cover', source_url: coverUrl, status: 'error', error: error.message });
        }
      } else {
        failed++;
        log(`  ! ${slug} cover download failed: ${dl.error}`);
        media.push({ owner_type: 'project', owner_slug: slug, role: 'cover', source_url: coverUrl, status: 'download-error', error: dl.error });
      }
    }

    const galleryRecords = [];
    for (let i = 0; i < galleryUrls.length; i++) {
      const url = galleryUrls[i];
      const dl = await download(url, cacheDir, { log });
      if (!dl.ok) {
        failed++;
        media.push({ owner_type: 'project', owner_slug: slug, role: `gallery-${i + 1}`, source_url: url, status: 'download-error', error: dl.error });
        continue;
      }
      if (!dl.cached) downloaded++;
      try {
        const outDir = path.join(publicDir, 'projects', slug);
        const base = `gallery-${String(i + 1).padStart(2, '0')}`;
        const result = await emitSizes(dl.buffer, outDir, base);
        written += Object.keys(result.outputs).length;
        galleryPublic.push(publicPath(root, result.outputs[1600]));
        galleryRecords.push({
          role: base,
          source_url: url,
          width: result.sourceWidth,
          height: result.sourceHeight,
          low_res: result.lowRes,
          outputs: Object.values(result.outputs).map((file) => publicPath(root, file)),
          status: 'ok',
        });
        if (result.lowRes) lowRes.push({ slug, width: result.sourceWidth, url, role: base });
      } catch (error) {
        failed++;
        log(`  ! ${slug} ${i + 1}. galeri: ${error.message}`);
      }
    }
    if (galleryRecords.length) {
      media.push({ owner_type: 'project', owner_slug: slug, role: 'gallery', images: galleryRecords });
    }

    await updateProject(slug, (json) => {
      if (coverUpdate) json.cover = coverUpdate;
      json.gallery = galleryPublic;
      json.low_res = Boolean(coverUpdate) && projectLowRes;
    });

    if ((index + 1) % 10 === 0) log(`  projects ${index + 1}/${projects.length}`);
  });

  // --- news -------------------------------------------------------------
  const news = (postsRaw.posts || []).filter((item) => item && item.slug);
  log(`Images: ${news.length} news posts`);
  await mapLimit(news, 6, async (post) => {
    const slug = post.slug;
    const coverUrl = post.cover_source || '';
    let coverPath = '';
    if (!coverUrl) {
      await updateNews(slug, (json) => { json.cover = ''; });
      return;
    }
    const dl = await download(coverUrl, cacheDir, { log });
    if (!dl.ok) {
      failed++;
      log(`  ! news ${slug}: ${dl.error}`);
      media.push({ owner_type: 'news', owner_slug: slug, role: 'cover', source_url: coverUrl, status: 'download-error', error: dl.error });
      return;
    }
    if (!dl.cached) downloaded++;
    try {
      const outDir = path.join(publicDir, 'news', slug);
      const result = await emitSizes(dl.buffer, outDir, 'cover');
      written += Object.keys(result.outputs).length;
      coverPath = publicPath(root, result.outputs[1600]);
      media.push({
        owner_type: 'news',
        owner_slug: slug,
        role: 'cover',
        source_url: coverUrl,
        width: result.sourceWidth,
        height: result.sourceHeight,
        low_res: result.lowRes,
        outputs: Object.values(result.outputs).map((file) => publicPath(root, file)),
        status: 'ok',
      });
      if (result.lowRes) lowRes.push({ slug: `news/${slug}`, width: result.sourceWidth, url: coverUrl, role: 'cover' });
      await updateNews(slug, (json) => { json.cover = coverPath; });
    } catch (error) {
      failed++;
      log(`  ! news ${slug}: ${error.message}`);
      media.push({ owner_type: 'news', owner_slug: slug, role: 'cover', source_url: coverUrl, status: 'error', error: error.message });
    }
  });

  // --- sectors ----------------------------------------------------------
  const sectors = (sectorsRaw.sectors || []).filter((item) => item && item.slug && item.image_source);
  log(`Images: ${sectors.length} sectors`);
  await mapLimit(sectors, 6, async (sector) => {
    const dl = await download(sector.image_source, cacheDir, { log });
    if (!dl.ok) {
      failed++;
      log(`  ! sector ${sector.slug}: ${dl.error}`);
      media.push({ owner_type: 'sector', owner_slug: sector.slug, role: 'hero', source_url: sector.image_source, status: 'download-error', error: dl.error });
      return;
    }
    if (!dl.cached) downloaded++;
    try {
      const outFile = path.join(publicDir, 'sectors', `${sector.slug}.webp`);
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      const meta = await sharp(dl.buffer, { failOn: 'none' }).metadata();
      await outputWebp(dl.buffer, outFile, 1600);
      written++;
      const isLowRes = Boolean(meta.width && meta.width < 800);
      media.push({
        owner_type: 'sector',
        owner_slug: sector.slug,
        role: 'hero',
        source_url: sector.image_source,
        width: meta.width || 0,
        height: meta.height || 0,
        low_res: isLowRes,
        outputs: [publicPath(root, outFile)],
        status: 'ok',
      });
      if (isLowRes) lowRes.push({ slug: `sector/${sector.slug}`, width: meta.width, url: sector.image_source, role: 'hero' });
    } catch (error) {
      failed++;
      log(`  ! sector ${sector.slug}: ${error.message}`);
    }
  });

  const report = {
    finished_at: new Date().toISOString(),
    downloaded,
    written,
    failed,
    lowRes,
    media,
  };
  await writeJson(path.join(rawDir, 'media.json'), media);
  await writeJson(path.join(rawDir, 'image-report.json'), report);
  log(`Images done: ${downloaded} source downloads, ${written} WebP files, ${failed} failures, ${lowRes.length} low-res`);
  return report;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  runImagePipeline({ root: process.cwd(), log: (message) => console.log(message), force: process.argv.includes('--force') })
    .catch((error) => {
      console.error('Image pipeline failed:', error);
      process.exitCode = 1;
    });
}
