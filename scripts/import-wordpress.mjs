#!/usr/bin/env node
/**
 * Fernas WordPress -> Astro content importer.
 *
 * Sources:
 *   - WP REST: /wp-json/wp/v2/pages, /posts, /categories, /media
 *   - XML sitemaps: portfolio, page, post
 *   - Portfolio detail HTML (the portfolio CPT is not exposed in REST)
 *
 * Output:
 *   - src/content/projects/<slug>.json
 *   - src/content/news/<slug>.json
 *   - src/content/pages/<slug>.json
 *   - data/raw/{pages,posts,portfolio,media,sectors}.json
 *   - docs/content-inventory.csv
 *   - docs/redirects.csv
 *   - data/TODO.md
 *
 * Images are delegated to scripts/optimize-images.mjs unless --no-images is passed.
 *
 * Usage:
 *   node scripts/import-wordpress.mjs [--no-images] [--refresh]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { runImagePipeline } from './optimize-images.mjs';

const ROOT = process.cwd();
const BASE = 'https://www.fernas.com.tr';
const UA = 'FernasSiteRebuild/1.0 (+https://www.fernas.com.tr)';
const TIMEOUT_MS = 30_000;
const CONCURRENCY = 6;

const ARGS = new Set(process.argv.slice(2));
const SKIP_IMAGES = ARGS.has('--no-images');

const OUT = {
  projects: path.join(ROOT, 'src/content/projects'),
  news: path.join(ROOT, 'src/content/news'),
  pages: path.join(ROOT, 'src/content/pages'),
  raw: path.join(ROOT, 'data/raw'),
  docs: path.join(ROOT, 'docs'),
};

const SITEMAPS = {
  portfolio: `${BASE}/wp-sitemap-posts-portfolio-1.xml`,
  page: `${BASE}/wp-sitemap-posts-page-1.xml`,
  post: `${BASE}/wp-sitemap-posts-post-1.xml`,
};

const REST = {
  pages: `${BASE}/wp-json/wp/v2/pages?per_page=100&_embed=0`,
  posts: `${BASE}/wp-json/wp/v2/posts?per_page=100&_embed=0`,
  categories: `${BASE}/wp-json/wp/v2/categories?per_page=100`,
};

const SECTORS = [
  { slug: 'insaat', tr: 'İnşaat', en: 'Construction', sourcePath: '/insaat-2/' },
  { slug: 'enerji', tr: 'Enerji', en: 'Energy', sourcePath: '/enerji/' },
  { slug: 'dogalgaz-dagitim', tr: 'Doğalgaz Dağıtım', en: 'Natural Gas Distribution', sourcePath: '/dogal-gaz-dagitim/' },
  { slug: 'sanayi', tr: 'Sanayi', en: 'Industry', sourcePath: '/sanayi/' },
  { slug: 'gida', tr: 'Gıda', en: 'Food', sourcePath: '/gida/' },
  { slug: 'turizm', tr: 'Turizm', en: 'Tourism', sourcePath: '/turizm/' },
];

const SECTOR_LABEL_TR = Object.fromEntries(SECTORS.map((s) => [s.slug, s.tr]));
const SECTOR_LABEL_EN = Object.fromEntries(SECTORS.map((s) => [s.slug, s.en]));

// Provinces + a few districts/cities that appear in project titles.
const TR_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan',
  'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
  'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne',
  'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay',
  'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu',
  'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya',
  'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon',
  'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
  'Bodrum', 'Silivri', 'Gündoğan', 'Ceyhan', 'Gebze', 'Tatvan', 'Silvan', 'Reyhanlı', 'Soma',
  'Afşin', 'Elbistan', 'Kangal', 'Cizre',
];

const COUNTRY_RULES = [
  { country: 'Katar', re: /\b(katar|qatar|umm bab|mesaieed|ras laffan|doha|qafac|qp rafineri)\b/i },
  { country: 'Kazakistan', re: /\b(kazakistan|kazakhstan|aporny)\b/i },
  { country: 'Hindistan', re: /\b(hindistan|india|dahej|vijaipour|south jetty)\b/i },
  { country: 'Azerbaycan', re: /\b(azerbaycan|azerbeycan|azerbaijan|baku|bakü)\b/i },
  { country: 'Gürcistan', re: /\b(gürcistan|gurcistan|georgia|tiflis|tbilisi)\b/i },
  { country: 'Irak', re: /\b(irak|iraq|erbil|duhok|dohuk)\b/i },
  { country: 'Rusya', re: /\b(rusya|russia)\b/i },
];

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

async function request(url, as = 'text') {
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: as === 'json'
            ? 'application/json,text/plain,*/*'
            : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        if (res.status >= 500 && attempt < 3) throw new Error(`HTTP ${res.status}`);
        return { ok: false, status: res.status, url, text: '', json: null };
      }
      if (as === 'json') {
        return { ok: true, status: res.status, url: res.url || url, json: await res.json(), text: '' };
      }
      return { ok: true, status: res.status, url: res.url || url, text: await res.text(), json: null };
    } catch (error) {
      lastError = error?.message || String(error);
      if (attempt < 3) await sleep(600 * attempt * attempt);
    }
  }
  return { ok: false, status: 0, url, text: '', json: null, error: lastError };
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => m[1].replace(/&amp;/g, '&').trim())
    .filter((url) => !url.endsWith('wp-sitemap.xsl'));
}

function decodeEntities(value = '') {
  const $ = load(`<span>${value}</span>`, null, false);
  return $('span').text();
}

function collapse(value = '') {
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

const TR_MAP = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o',
  ş: 's', Ş: 's', ü: 'u', Ü: 'u', â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
  ä: 'a', å: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', ñ: 'n', ô: 'o', œ: 'oe', æ: 'ae',
};

export function transliterate(value = '') {
  return String(value)
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .join('');
}

export function makeSlug(title = '', fallback = 'proje') {
  const base = transliterate(htmlToPlain(title))
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/['’`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90)
    .replace(/-+$/g, '');
  return base || fallback;
}

function normKey(value = '') {
  return collapse(transliterate(value)).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeImageUrl(raw) {
  if (!raw) return '';
  let url = decodeEntities(raw).trim();
  if (!url || url.startsWith('data:')) return '';
  if (url.startsWith('//')) url = `https:${url}`;
  if (url.startsWith('/')) url = `${BASE}${url}`;
  if (!/^https?:\/\//i.test(url)) return '';
  // WordPress thumbnails: -750x562_c, -1024x768, -300x200 ...
  url = url.replace(/-\d{2,4}x\d{2,4}(?:_c)?(?=\.(?:jpe?g|png|webp|gif|avif)(?:\?|$))/i, '');
  // Strip query strings on uploads, they are cache-busters.
  if (url.includes('/wp-content/uploads/')) url = url.split('?')[0];
  return url;
}

function imageKey(url) {
  if (!url) return '';
  try {
    return path.basename(new URL(url).pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function absoluteUrl(href, base) {
  if (!href) return '';
  try {
    return new URL(decodeEntities(href), base || BASE).href;
  } catch {
    return href;
  }
}

/**
 * Clean imported HTML: drop scripts/styles/social chrome, strip presentational
 * attributes, absolutise asset/link URLs. Text content is never rewritten.
 */
function cleanContentHtml(html, baseUrl = BASE) {
  if (!html) return '';
  const withoutComments = String(html).replace(/<!--[\s\S]*?-->/g, '');
  const $ = load(`<div id="__fernas_root">${withoutComments}</div>`, null, false);
  const $root = $('#__fernas_root');

  $root.find('script,style,noscript,iframe,svg,form .arf_form_outer_wrapper').remove();
  $root.find('.elm-custommenu,.zn-shareIcons,.portfolio-item-otherdetails,.breadcrumbs,.zn-shareIcons-item,.screen-reader-text,.sr-only').remove();
  $root.find('[class*="share"], [id*="share"], [class*="social"]').remove();

  $root.find('*').each((_, el) => {
    const node = $(el);
    const tag = (el.tagName || '').toLowerCase();
    node.removeAttr('class');
    node.removeAttr('id');
    node.removeAttr('style');
    node.removeAttr('srcset');
    node.removeAttr('sizes');
    node.removeAttr('loading');
    node.removeAttr('decoding');
    node.removeAttr('itemprop');
    node.removeAttr('itemscope');
    node.removeAttr('itemtype');
    node.removeAttr('role');
    for (const name of Object.keys(el.attribs || {})) {
      if (/^(data-|on)/i.test(name) || /^aria-/i.test(name)) node.removeAttr(name);
    }
    const href = node.attr('href');
    if (href) node.attr('href', absoluteUrl(href, baseUrl));
    const src = node.attr('src');
    if (src) node.attr('src', normalizeImageUrl(absoluteUrl(src, baseUrl)));
    if (tag === 'img') {
      node.attr('loading', 'lazy');
      node.attr('decoding', 'async');
    }
  });

  let out = $root.html() || '';
  out = out
    .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<\/p>/gi, '')
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Remove nested empty layout wrappers left behind by Zion Builder.
  for (let pass = 0; pass < 10; pass++) {
    let removed = 0;
    $root.find('div,span,section,article,header,footer,aside,p,h1,h2,h3,h4,h5,h6,ul,ol,li,table').each((_, el) => {
      const node = $(el);
      if (node.find('img,video,audio,iframe,table,form,input,button,select,textarea,br,hr,canvas').length) return;
      const text = node.text().replace(/\u00a0/g, ' ').trim();
      if (!text) {
        node.remove();
        removed++;
      }
    });
    if (!removed) break;
  }

  // Flatten old builder wrappers so the imported body is semantic content only.
  $root.find('div').each((_, el) => {
    const node = $(el);
    node.replaceWith(node.contents());
  });

  out = ($root.html() || '')
    .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<\/p>/gi, '')
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
}

function htmlToPlain(html = '') {
  if (!html) return '';
  const $ = load(`<div id="__plain">${html}</div>`, null, false);
  return collapse($('#__plain').text());
}

function firstParagraph(html = '') {
  if (!html) return '';
  const $ = load(`<div id="__para">${html}</div>`, null, false);
  const p = $('#__para p').map((_, el) => collapse($(el).text())).get().find((text) => text.length > 15);
  if (p) return p.length > 700 ? `${p.slice(0, 697).trimEnd()}…` : p;
  const plain = htmlToPlain(html);
  return plain.length > 700 ? `${plain.slice(0, 697).trimEnd()}…` : plain;
}

function detectSector({ categories = [], breadcrumb = '', title = '', body = '' }) {
  const haystack = collapse([
    ...categories,
    breadcrumb,
    title,
    body.slice(0, 1200),
  ].join(' ')).toLowerCase();

  const scores = {
    'dogalgaz-dagitim': 0,
    gida: 0,
    turizm: 0,
    sanayi: 0,
    enerji: 0,
    insaat: 0,
  };

  const bump = (sector, re, points) => {
    const matches = haystack.match(re);
    if (matches) scores[sector] += points * matches.length;
  };

  bump('dogalgaz-dagitim', /\b(doğalgaz|dogalgaz|doğal gaz|dogal gaz|boru hatt[ıi]|boruhatt[ıi]|pipe ?line|pipeline|natural gas|gaz dağıtım|gaz temini|gaz iletim|lng)\b/g, 7);
  bump('gida', /\b(gıda|gida|food|meyve suyu|meyve bahçe|soğuk hava|soguk hava|tarım|tarim)\b/g, 6);
  bump('turizm', /\b(turizm|tourism|otel|hotel|resort|tatil|beach)\b/g, 7);
  bump('sanayi', /\b(sanayi|industrial|fabrika|factory|üretim tesisi|uretim tesisi|production plant|alçı|alci|gips|kimyasal|fren sistemi)\b/g, 6);
  bump('enerji', /\b(enerji|energy|rüzgar|ruzgar|wind|hidroelektrik|hydro|baraj|dam|santral|power plant|elektrik|solar|güneş|gunes|ges|hes|res|wpp|hpp)\b/g, 5);
  bump('insaat', /\b(inşaat|insaat|construction|yol|road|highway|otoyol|demiryolu|railway|sulama|irrigation|içme suyu|icme suyu|kanal|kanalizasyon|altyapı|altyapi|üstyapı|ustyapi|bina|building|okul|school|otogar|terminal|köprü|kopru)\b/g, 4);
  bump('insaat', /\b(dekapaj|dekanpaj|madencilik|mining|kömür|komur|linyit|açık ocak|acik ocak|ocak işletmesi|ocak isletmesi|kireçtaşı|kirectasi|kömür temini|komur temini)\b/g, 7);

  let best = 'diger';
  let bestScore = 0;
  for (const [sector, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = sector;
      bestScore = score;
    }
  }
  return best;
}

function detectStatus({ categories = [], breadcrumb = '' }) {
  const haystack = `${categories.join(' ')} ${breadcrumb}`.toLowerCase();
  if (/(tamamlanan|completed|bitirilen)/.test(haystack)) return 'tamamlandi';
  if (/(devam eden|ongoing|under construction|devam ediyor)/.test(haystack)) return 'devam-ediyor';
  if (/(işletmede|isletmede|\boperating\b|\bin operation\b|\boperational\b)/.test(haystack)) return 'isletmede';
  return 'tamamlandi';
}

function detectCountry(text) {
  for (const rule of COUNTRY_RULES) {
    if (rule.re.test(text)) return rule.country;
  }
  return '';
}

function detectCity(text) {
  const haystack = transliterate(String(text)).toLowerCase();
  let best = null;
  let bestIndex = Number.POSITIVE_INFINITY;
  for (const city of TR_CITIES) {
    const needle = transliterate(city).toLowerCase();
    const re = new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
    const match = re.exec(haystack);
    if (match && match.index < bestIndex) {
      best = city;
      bestIndex = match.index;
    }
  }
  return best || '';
}

function detectYear(text) {
  const matches = [...String(text).matchAll(/\b(19[5-9]\d|20[0-2]\d)\b/g)].map((m) => Number(m[1]));
  return matches.length ? Math.min(...matches.filter((y) => y >= 1950 && y <= 2026)) : null;
}

function detectCapacity(text) {
  const re = /(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(MWp?|MWe|MW|m³|m3|km|kilometre|ton(?:[/ ]?(?:yıl|yil|gün|gun))?|m²|m2)\b/i;
  const match = String(text).match(re);
  if (!match) return '';
  const value = match[1].replace(/\s/g, '');
  const unit = match[2]
    .replace(/^m3$/i, 'm³')
    .replace(/^m2$/i, 'm²')
    .replace(/^kilometre$/i, 'km')
    .replace(/^mwp$/i, 'MWp')
    .replace(/^mwe$/i, 'MWe');
  return `${value} ${unit}`;
}

function detectClient(text) {
  const match = String(text).match(/\b(?:işveren|isveren|client|owner)\s*[:\-]\s*([^\n.;<>]{2,100})/i);
  return match ? collapse(match[1]) : '';
}

function parsePortfolioHtml(html, pageUrl, lang) {
  const $ = load(html);
  const htmlLang = ($('html').attr('lang') || '').toLowerCase();
  const title = collapse(
    $('h1.portfolio-item-title').first().text()
      || $('h1').first().text()
      || $('title').text().split('–')[0],
  );

  const $body = $('.portfolio-item-desc-inner').first();
  const rawBodyHtml = $body.length ? ($body.html() || '') : '';
  const bodyHtml = cleanContentHtml(rawBodyHtml, pageUrl);
  const bodyText = htmlToPlain(bodyHtml);

  const categories = $('.portfolio-item-details-item a')
    .map((_, el) => collapse($(el).text()))
    .get()
    .filter(Boolean);

  const breadcrumbParts = $('.breadcrumbs li')
    .map((_, el) => collapse($(el).text()))
    .get()
    .filter(Boolean);
  const breadcrumb = breadcrumbParts.length
    ? breadcrumbParts.join(' > ')
    : collapse($('.breadcrumbs').first().text());

  const coverAnchor = $('.portfolio-item-right a[href]').first().attr('href')
    || $('.portfolio-item--light a[data-lightbox]').first().attr('href')
    || '';
  let coverSource = normalizeImageUrl(absoluteUrl(coverAnchor, pageUrl));
  if (!coverSource) {
    coverSource = normalizeImageUrl(absoluteUrl(
      $('.portfolio-item-right img').first().attr('src')
        || $('.portfolio-item--light img').first().attr('src')
        || '',
      pageUrl,
    ));
  }

  const gallerySources = [];
  const pushImage = (url) => {
    const normalized = normalizeImageUrl(absoluteUrl(url, pageUrl));
    if (!normalized) return;
    if (coverSource && normalized === coverSource) return;
    if (!gallerySources.includes(normalized)) gallerySources.push(normalized);
  };
  $body.find('img').each((_, el) => pushImage($(el).attr('src')));
  $('#content .portfolio-item-desc img').each((_, el) => pushImage($(el).attr('src')));
  $('#content .portfolio-item-right img').each((_, el) => pushImage($(el).attr('src')));

  return {
    language: lang || (htmlLang.startsWith('en') ? 'en' : 'tr'),
    html_lang: htmlLang || null,
    title,
    body_html: bodyHtml,
    body_text: bodyText,
    categories,
    breadcrumb,
    cover_source: coverSource,
    gallery_sources: gallerySources.slice(0, 6),
    description: collapse($('meta[name="description"]').attr('content') || ''),
    source_url: pageUrl,
  };
}

function parsePostEnHtml(html, pageUrl) {
  const $ = load(html);
  const title = collapse(
    $('h1.page-title').first().text()
      || $('.kl-blog-post-title').first().text()
      || $('h1').first().text()
      || $('title').text().split('–')[0],
  );
  const $body = $('.itemBody, .kl-blog-post-body, #th-content-post .itemBody').first();
  const bodyHtml = cleanContentHtml($body.length ? ($body.html() || '') : '', pageUrl);
  return {
    title,
    body_html: bodyHtml,
    body_text: htmlToPlain(bodyHtml),
    description: collapse($('meta[name="description"]').attr('content') || ''),
    html_lang: ($('html').attr('lang') || '').toLowerCase(),
  };
}

function parsePageHtml(html, pageUrl) {
  const $ = load(html);
  const section = $('.zn_pb_wrapper > section').first();
  const rawBody = section.length
    ? section.html()
    : ($('#content').html() || $('.site-content').html() || '');

  const clean = cleanContentHtml(rawBody || '', pageUrl);

  const h1 = collapse($('h1').first().text());
  const titleTag = collapse($('title').text()).replace(/\s*[–|-]\s*Fernas.*$/i, '');
  const title = h1 || titleTag;

  return {
    title,
    body_html: clean,
    body_text: htmlToPlain(clean),
    html_lang: ($('html').attr('lang') || '').toLowerCase(),
    description: collapse($('meta[name="description"]').attr('content') || ''),
  };
}

function isDemoSlug(slug = '') {
  return /^(seamlessly|distinctively|continually|synergistically|proactively|efficiently|appropriately|conveniently|rapidiously|monotonectally|assertively|authoritatively|dramatically|holisticly|interactively|intrinsicly|dynamically|globally|uniquely|compellingly|professionally|objectively|competently|collaboratively|conveniently)/i.test(slug);
}

function needsReadableSlug(slug = '') {
  // Known Kozbükü/Sebenoba URL mix-up: the title is the source of truth.
  return isDemoSlug(slug) || /^hatay-sebenoba-ruzgar-santrali-anlasmasi$/i.test(slug);
}

function isGenericPortfolioSlug(slug = '') {
  return /^portfolio-\d+(?:-\d+)*$/.test(slug);
}

function sanitizePageSlug(slug = '') {
  return slug || 'sayfa';
}

function sanitizeText(value) {
  // Windows-1252 kaynaklı C1 kontrol karakterleri ve bozuk replacement char.
  return String(value).replace(/[\u0080-\u009f\ufffd]/g, '');
}

function sanitizeDeep(value) {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeDeep(item)]));
  }
  return value;
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(sanitizeDeep(value), null, 2)}\n`, 'utf8');
}

function csvEscape(value) {
  const text = value == null ? '' : sanitizeText(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function writeCsv(file, header, rows) {
  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(','));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${lines.join('\n')}\n`, 'utf8');
}

function sortSector(a, b) {
  const order = ['insaat', 'enerji', 'dogalgaz-dagitim', 'sanayi', 'gida', 'turizm', 'diger'];
  return order.indexOf(a) - order.indexOf(b);
}

async function main() {
  const startedAt = new Date();
  console.log('Fernas import started', startedAt.toISOString());

  for (const dir of [OUT.projects, OUT.news, OUT.pages, OUT.raw, OUT.docs, path.join(OUT.raw, 'media')]) {
    await fs.mkdir(dir, { recursive: true });
  }

  // --- sitemaps ---------------------------------------------------------
  console.log('Fetching sitemaps...');
  const sitemapResults = await Promise.all(
    Object.entries(SITEMAPS).map(async ([name, url]) => {
      const res = await request(url);
      if (!res.ok) return { name, urls: [], lastmod: new Map(), error: res.status || res.error };
      const urls = parseSitemap(res.text);
      const lastmod = new Map();
      for (const match of res.text.matchAll(/<url>\s*<loc>\s*([^<]+?)\s*<\/loc>\s*<lastmod>\s*([^<]+?)\s*<\/lastmod>/g)) {
        lastmod.set(match[1].replace(/&amp;/g, '&').trim(), match[2].trim());
      }
      return { name, urls, lastmod };
    }),
  );

  const sitemap = Object.fromEntries(sitemapResults.map((item) => [item.name, item]));
  for (const item of sitemapResults) {
    if (item.error) console.warn(`  ! sitemap ${item.name} failed: ${item.error}`);
    else console.log(`  ${item.name}: ${item.urls.length} URLs`);
  }

  // --- REST -------------------------------------------------------------
  console.log('Fetching WP REST pages/posts/categories...');
  const [pagesRes, postsRes, categoriesRes] = await Promise.all([
    request(REST.pages, 'json'),
    request(REST.posts, 'json'),
    request(REST.categories, 'json'),
  ]);

  const wpPages = Array.isArray(pagesRes.json) ? pagesRes.json : [];
  const wpPosts = Array.isArray(postsRes.json) ? postsRes.json : [];
  const wpCategories = Array.isArray(categoriesRes.json) ? categoriesRes.json : [];
  const categoryName = new Map(wpCategories.map((cat) => [cat.id, decodeEntities(cat.name)]));
  if (!wpPages.length) throw new Error('WP pages REST returned no rows');
  if (!wpPosts.length) throw new Error('WP posts REST returned no rows');

  // --- portfolio scrape (TR + EN) --------------------------------------
  console.log(`Scraping ${sitemap.portfolio.urls.length} portfolio pages (TR + EN)...`);
  const portfolioTasks = sitemap.portfolio.urls.map((url) => async () => {
    const legacySlug = new URL(url).pathname.replace(/^\/portfolio\//, '').replace(/\/$/, '');
    const tr = await request(url);
    if (!tr.ok) {
      return {
        legacy_slug: legacySlug,
        source_url: url,
        error: `TR HTTP ${tr.status || tr.error}`,
      };
    }
    const trData = parsePortfolioHtml(tr.text, url, 'tr');
    const enUrl = `${url.replace(/\/$/, '')}/?lang=en`;
    let enData = null;
    let enError = '';
    {
      const en = await request(enUrl);
      if (en.ok) {
        const candidate = parsePortfolioHtml(en.text, enUrl, 'en');
        const sameTitle = normKey(candidate.title) === normKey(trData.title);
        const hasEnglish = candidate.html_lang.startsWith('en')
          && candidate.body_text.length > 10
          && (!sameTitle || normKey(candidate.body_text) !== normKey(trData.body_text));
        if (hasEnglish) enData = candidate;
      } else {
        enError = `EN HTTP ${en.status || en.error}`;
      }
    }

    return {
      legacy_slug: legacySlug,
      source_url: trData.source_url,
      lastmod: sitemap.portfolio.lastmod.get(url) || null,
      title_tr: trData.title,
      title_en: enData?.title || '',
      body_html_tr: trData.body_html,
      body_html_en: enData?.body_html || '',
      body_text_tr: trData.body_text,
      body_text_en: enData?.body_text || '',
      categories_tr: trData.categories,
      categories_en: enData?.categories || [],
      breadcrumb_tr: trData.breadcrumb,
      breadcrumb_en: enData?.breadcrumb || '',
      cover_source: trData.cover_source,
      gallery_sources: trData.gallery_sources,
      source_url_en: enData?.source_url || '',
      language: 'tr',
      en_error: enError,
    };
  });

  const rawPortfolio = await mapLimit(portfolioTasks, CONCURRENCY, (task) => task());

  // Fall back to the sitemap for anything that failed outright.
  const failedPortfolio = rawPortfolio.filter((row) => row?.error);
  for (const row of failedPortfolio) {
    if (!row.source_url) row.source_url = `${BASE}/portfolio/${row.legacy_slug}/`;
  }

  // --- dedupe portfolio -------------------------------------------------
  const groups = new Map();
  for (const row of rawPortfolio) {
    if (!row || row.__error || row.error || !row.title_tr) continue;
    const titleKey = normKey(row.title_tr);
    if (!groups.has(titleKey)) groups.set(titleKey, []);
    groups.get(titleKey).push(row);
  }

  const canonical = [];
  const merged = [];
  const slugSeen = new Map();

  for (const [titleKey, rows] of groups) {
    // Same title + same image = duplicate. Same title + different image = separate project.
    const byImage = new Map();
    for (const row of rows) {
      const key = imageKey(row.cover_source) || '__no_image__';
      if (!byImage.has(key)) byImage.set(key, []);
      byImage.get(key).push(row);
    }
    // If one variant has no image, fold it into the first image group.
    if (byImage.size > 1 && byImage.has('__no_image__')) {
      const noImage = byImage.get('__no_image__');
      byImage.delete('__no_image__');
      const firstKey = [...byImage.keys()][0];
      byImage.get(firstKey).push(...noImage);
    }

    for (const imageGroup of byImage.values()) {
      imageGroup.sort((a, b) => {
        const score = (row) => (
          (isGenericPortfolioSlug(row.legacy_slug) ? 0 : 10)
          + (row.title_en ? 4 : 0)
          + (row.cover_source ? 2 : 0)
          + Math.min(3, Math.floor((row.body_text_tr || '').length / 500))
        );
        return score(b) - score(a);
      });

      const primary = imageGroup[0];
      const secondary = imageGroup.slice(1);

      const sector = detectSector({
        categories: [...(primary.categories_tr || []), ...(primary.categories_en || [])],
        breadcrumb: `${primary.breadcrumb_tr || ''} ${primary.breadcrumb_en || ''}`,
        title: `${primary.title_tr || ''} ${primary.title_en || ''}`,
        body: `${primary.body_text_tr || ''} ${primary.body_text_en || ''}`,
      });

      const locationText = `${primary.title_tr || ''} ${primary.title_en || ''} ${primary.body_text_tr || ''}`;
      const city = detectCity(locationText);
      const country = detectCountry(locationText) || (city ? 'Türkiye' : '');
      const status = detectStatus({
        categories: [...(primary.categories_tr || []), ...(primary.categories_en || [])],
        breadcrumb: `${primary.breadcrumb_tr || ''} ${primary.breadcrumb_en || ''}`,
      });

      let baseSlug = makeSlug(primary.title_tr, 'proje');
      let slug = baseSlug;
      let suffix = 2;
      while (slugSeen.has(slug)) {
        slug = `${baseSlug}-${suffix++}`;
      }
      slugSeen.set(slug, primary.title_tr);

      const gallery = [...new Set((primary.gallery_sources || []).filter((url) => url && url !== primary.cover_source))].slice(0, 6);
      const altBaseTr = `${primary.title_tr} — ${SECTOR_LABEL_TR[sector] || 'Proje'}${city ? `, ${city}` : (country ? `, ${country}` : '')}`;
      const altBaseEn = `${primary.title_en || primary.title_tr} — ${SECTOR_LABEL_EN[sector] || 'Project'}${city ? `, ${city}` : (country ? `, ${country}` : '')}`;

      const project = {
        slug,
        legacy_slug: primary.legacy_slug,
        title_tr: primary.title_tr,
        title_en: primary.title_en || '',
        sector,
        status,
        country,
        city,
        year: detectYear(`${primary.title_tr} ${primary.body_text_tr}`),
        client: detectClient(primary.body_text_tr),
        capacity: detectCapacity(`${primary.title_tr} ${primary.body_text_tr}`),
        scope_tr: firstParagraph(primary.body_html_tr),
        scope_en: firstParagraph(primary.body_html_en),
        body_html_tr: primary.body_html_tr,
        body_html_en: primary.body_html_en || '',
        cover: primary.cover_source ? `/images/projects/${slug}/cover-1600.webp` : '',
        gallery: gallery.map((_, index) => `/images/projects/${slug}/gallery-${String(index + 1).padStart(2, '0')}-1600.webp`),
        alt_tr: altBaseTr,
        alt_en: altBaseEn,
        featured: false,
        sort: 0,
        source_url: primary.source_url,
        source_url_en: primary.source_url_en || '',
        low_res: false,
        imported_at: new Date().toISOString(),
      };

      // Fold duplicate records into the canonical one.
      for (const dup of secondary) {
        if (!project.title_en && dup.title_en) project.title_en = dup.title_en;
        if (!project.body_html_en && dup.body_html_en) project.body_html_en = dup.body_html_en;
        if (!project.source_url_en && dup.source_url_en) project.source_url_en = dup.source_url_en;
        if (!project.cover && dup.cover_source) {
          project.cover = `/images/projects/${slug}/cover-1600.webp`;
        }
        if (!project.capacity) project.capacity = detectCapacity(`${dup.title_tr} ${dup.body_text_tr}`);
        merged.push({
          canonical_slug: slug,
          legacy_slug: dup.legacy_slug,
          source_url: dup.source_url,
          reason: 'same title + same image',
        });
      }

      canonical.push({
        json: project,
        raw: {
          ...primary,
          duplicate_legacy_slugs: secondary.map((row) => row.legacy_slug),
        },
        gallery_sources: gallery,
        source_urls: imageGroup.map((row) => row.source_url),
      });
    }
  }

  canonical.sort((a, b) => {
    const sectorDiff = sortSector(a.json.sector, b.json.sector);
    if (sectorDiff !== 0) return sectorDiff;
    return a.json.title_tr.localeCompare(b.json.title_tr, 'tr');
  });
  canonical.forEach((entry, index) => {
    entry.json.sort = index + 1;
  });

  // --- news -------------------------------------------------------------
  console.log(`Fetching ${wpPosts.length} news posts (TR REST + EN HTML)...`);
  const newsRaw = await mapLimit(wpPosts, CONCURRENCY, async (post) => {
    const titleTr = decodeEntities(post.title?.rendered || '');
    const bodyHtmlTr = cleanContentHtml(post.content?.rendered || '', post.link);
    const excerptTr = htmlToPlain(post.excerpt?.rendered || '').slice(0, 320);
    const enUrl = `${post.link.replace(/\/$/, '')}/?lang=en`;
    const en = await request(enUrl);
    let enData = null;
    if (en.ok) {
      const candidate = parsePostEnHtml(en.text, enUrl);
      const sameTitle = normKey(candidate.title) === normKey(titleTr);
      const sameBody = normKey(candidate.body_text) === normKey(htmlToPlain(bodyHtmlTr));
      if (candidate.html_lang.startsWith('en') && candidate.body_text.length > 10 && !(sameTitle && sameBody)) {
        enData = candidate;
      }
    }
    return {
      id: post.id,
      legacy_slug: post.slug,
      source_url: post.link,
      title_tr: titleTr,
      title_en: enData?.title || '',
      body_html_tr: bodyHtmlTr,
      body_html_en: enData?.body_html || '',
      body_text_tr: htmlToPlain(bodyHtmlTr),
      body_text_en: enData?.body_text || '',
      excerpt_tr: excerptTr,
      excerpt_en: enData ? (enData.description || htmlToPlain(enData.body_html).slice(0, 320)) : '',
      published_at: post.date || '',
      modified_at: post.modified || '',
      category: (post.categories || []).map((id) => categoryName.get(id) || '').filter(Boolean).join(', ') || 'Genel',
      featured_media: post.featured_media || 0,
      source_url_en: enData ? enUrl : '',
      demo_slug: isDemoSlug(post.slug),
      slug_needs_fix: needsReadableSlug(post.slug),
      imported_at: new Date().toISOString(),
    };
  });

  const mediaIds = [...new Set(newsRaw.map((row) => row.featured_media).filter(Boolean))];
  let mediaById = new Map();
  if (mediaIds.length) {
    const mediaRes = await request(`${BASE}/wp-json/wp/v2/media?include=${mediaIds.join(',')}&per_page=100`, 'json');
    if (Array.isArray(mediaRes.json)) {
      mediaById = new Map(mediaRes.json.map((item) => [item.id, item]));
    }
  }

  for (const row of newsRaw) {
    const media = mediaById.get(row.featured_media);
    row.cover_source = media?.source_url ? normalizeImageUrl(media.source_url) : '';
    row.cover_alt = media?.alt_text || '';
    row.cover_width = media?.media_details?.width || null;
    row.cover_height = media?.media_details?.height || null;
  }

  const newsSlugSeen = new Set();
  const news = [];
  for (const row of newsRaw) {
    let slug;
    if (row.slug_needs_fix) {
      slug = makeSlug(row.title_tr, `haber-${row.id}`);
    } else {
      slug = row.legacy_slug;
    }
    let unique = slug;
    let suffix = 2;
    while (newsSlugSeen.has(unique)) unique = `${slug}-${suffix++}`;
    newsSlugSeen.add(unique);

    news.push({
      raw: { ...row, slug: unique },
      json: {
        slug: unique,
        title_tr: row.title_tr,
        title_en: row.title_en || '',
        excerpt_tr: row.excerpt_tr || htmlToPlain(row.body_html_tr).slice(0, 240),
        excerpt_en: row.excerpt_en || '',
        body_html_tr: row.body_html_tr,
        body_html_en: row.body_html_en || '',
        published_at: row.published_at,
        category: row.category,
        cover: row.cover_source ? `/images/news/${unique}/cover-1600.webp` : '',
        source_url: row.source_url,
        source_url_en: row.source_url_en || '',
        imported_at: row.imported_at,
      },
    });
  }

  // --- pages ------------------------------------------------------------
  console.log(`Scraping ${wpPages.length} pages (TR + EN)...`);
  const pagesRaw = await mapLimit(wpPages, CONCURRENCY, async (wpPage) => {
    const slug = sanitizePageSlug(wpPage.slug);
    const tr = await request(wpPage.link);
    const trData = tr.ok ? parsePageHtml(tr.text, wpPage.link) : null;
    const enUrl = `${wpPage.link.replace(/\/$/, '')}/?lang=en`;
    const en = await request(enUrl);
    const enData = en.ok ? parsePageHtml(en.text, enUrl) : null;

    const titleTr = decodeEntities(wpPage.title?.rendered || '') || trData?.title || slug;
    const titleEn = enData?.title || '';
    const bodyTr = trData?.body_html || cleanContentHtml(wpPage.content?.rendered || '', wpPage.link);
    const bodyEn = enData?.body_html || '';
    const bodyEnText = htmlToPlain(bodyEn);
    const sameTitle = normKey(titleEn) === normKey(titleTr);
    const sameBody = normKey(bodyEnText) === normKey(htmlToPlain(bodyTr));
    const notFound = /page not found|sayfa bulunamadı|404/i.test(`${titleEn} ${enData?.title || ''}`);
    const hasEn = Boolean(titleEn) && bodyEnText.length > 20 && !notFound && !(sameTitle && sameBody);

    return {
      id: wpPage.id,
      slug,
      legacy_slug: wpPage.slug,
      source_url: wpPage.link,
      title_tr: titleTr,
      title_en: hasEn ? titleEn : '',
      body_html_tr: bodyTr,
      body_html_en: hasEn ? bodyEn : '',
      body_text_tr: htmlToPlain(bodyTr),
      body_text_en: hasEn ? bodyEnText : '',
      description_tr: trData?.description || '',
      description_en: hasEn ? (enData?.description || '') : '',
      template: pageTemplate(slug),
      modified_at: wpPage.modified || '',
      source_url_en: hasEn ? enUrl : '',
      language: 'tr',
      rest_content_length: (wpPage.content?.rendered || '').length,
    };
  });

  // --- write raw audit files -------------------------------------------
  await writeJson(path.join(OUT.raw, 'portfolio.json'), {
    fetched_at: new Date().toISOString(),
    source: SITEMAPS.portfolio,
    count: rawPortfolio.length,
    failed: failedPortfolio.map((row) => ({ legacy_slug: row.legacy_slug, source_url: row.source_url, error: row.error })),
    canonical: canonical.map((entry) => ({ ...entry.raw, slug: entry.json.slug })),
    merged_duplicates: merged,
    records: rawPortfolio,
  });

  await writeJson(path.join(OUT.raw, 'posts.json'), {
    fetched_at: new Date().toISOString(),
    source: REST.posts,
    count: newsRaw.length,
    posts: news.map((entry) => entry.raw),
  });

  await writeJson(path.join(OUT.raw, 'pages.json'), {
    fetched_at: new Date().toISOString(),
    source: REST.pages,
    count: pagesRaw.length,
    pages: pagesRaw,
  });

  // Sector pages: scrape a representative hero image + labels.
  console.log('Fetching sector pages...');
  const sectorsRaw = await mapLimit(SECTORS, CONCURRENCY, async (sector) => {
    const url = `${BASE}${sector.sourcePath}`;
    const res = await request(url);
    let image = '';
    let title = sector.tr;
    if (res.ok) {
      const $ = load(res.text);
      const uploads = [...new Set(
        [...res.text.matchAll(/https:\/\/www\.fernas\.com\.tr\/wp-content\/uploads\/[^"'\s\\)<>]+/g)]
          .map((m) => m[0])
          .filter((u) => !/\/(?:logo|flags?)[^/]*$/i.test(u))
          .filter((u) => !u.includes('/plugins/'))
          .filter((u) => !u.includes('/cache/'))
          .filter((u) => !/-\d{2,4}x\d{2,4}(?:_c)?\.(?:jpe?g|png|webp)$/i.test(u))
          .filter((u) => /\.(?:jpe?g|png|webp|avif)(?:\?.*)?$/i.test(u)),
      )];
      image = normalizeImageUrl(uploads[0] || '');
      const h1 = collapse($('h1').first().text());
      const pageTitle = collapse($('title').text()).split('–')[0];
      title = h1 || pageTitle || sector.tr;
      if (sector.slug === 'insaat' && /inşaat|insaat/i.test(title)) title = sector.tr;
    }
    return {
      slug: sector.slug,
      title_tr: collapse(title) || sector.tr,
      title_en: sector.en,
      source_url: url,
      image_source: image,
      image_output: image ? `/images/sectors/${sector.slug}.webp` : '',
    };
  });
  await writeJson(path.join(OUT.raw, 'sectors.json'), {
    fetched_at: new Date().toISOString(),
    count: sectorsRaw.length,
    sectors: sectorsRaw,
  });

  // --- write content JSON ----------------------------------------------
  // Remove stale generated files first so renamed/deleted legacy records do not linger.
  for (const dir of [OUT.projects, OUT.news, OUT.pages]) {
    const entries = await fs.readdir(dir).catch(() => []);
    for (const entry of entries) {
      if (entry.endsWith('.json')) await fs.rm(path.join(dir, entry), { force: true });
    }
  }

  for (const entry of canonical) {
    await writeJson(path.join(OUT.projects, `${entry.json.slug}.json`), entry.json);
  }
  for (const entry of news) {
    await writeJson(path.join(OUT.news, `${entry.json.slug}.json`), entry.json);
  }
  for (const page of pagesRaw) {
    const json = {
      slug: page.slug,
      title_tr: page.title_tr,
      title_en: page.title_en,
      body_html_tr: page.body_html_tr,
      body_html_en: page.body_html_en,
      template: page.template,
      source_url: page.source_url,
      source_url_en: page.source_url_en,
      modified_at: page.modified_at,
    };
    await writeJson(path.join(OUT.pages, `${page.slug}.json`), json);
  }

  // --- images -----------------------------------------------------------
  let imageReport = null;
  if (!SKIP_IMAGES) {
    console.log('Running image pipeline...');
    imageReport = await runImagePipeline({ root: ROOT, log: (message) => console.log(message) });
  } else {
    console.log('Skipping image pipeline (--no-images).');
  }

  // --- inventory + redirects -------------------------------------------
  const inventory = [];
  for (const entry of canonical) {
    const project = entry.json;
    const notes = [];
    if (!project.title_en) notes.push('EN başlık yok');
    if (!project.body_html_en) notes.push('EN gövde yok');
    if (isGenericPortfolioSlug(project.legacy_slug)) notes.push('legacy slug generic');
    if (merged.some((dup) => dup.canonical_slug === project.slug)) notes.push('duplicate merged');
    if (project.sector === 'diger') notes.push('sektör belirsiz');
    if (project.low_res) notes.push('low-res cover');
    inventory.push([
      'project', project.title_tr, project.slug, project.source_url,
      project.title_en ? 'tr+en' : 'tr', project.sector, project.status,
      String(1 + project.gallery.length), notes.join('; '),
    ]);
  }
  for (const entry of news) {
    const item = entry.json;
    const notes = [];
    if (!item.title_en) notes.push('EN başlık yok');
    if (!item.body_html_en) notes.push('EN gövde yok');
    if (entry.raw.demo_slug) notes.push(`demo slug: ${entry.raw.legacy_slug}`);
    else if (entry.raw.slug_needs_fix) notes.push(`legacy slug düzeltildi: ${entry.raw.legacy_slug}`);
    if (/sebenoba/i.test(item.source_url) && /kozb/i.test(item.title_tr)) notes.push('Kozbükü/ Sebenoba URL karışıklığı');
    inventory.push([
      'news', item.title_tr, item.slug, item.source_url,
      item.title_en ? 'tr+en' : 'tr', '', '', item.cover ? '1' : '0', notes.join('; '),
    ]);
  }
  for (const page of pagesRaw) {
    const notes = [];
    if (!page.title_en) notes.push('EN başlık yok');
    if (!page.body_html_en) notes.push('EN gövde yok');
    if (page.rest_content_length === 0) notes.push('REST içeriği boş; HTML scrape kullanıldı');
    if (page.slug === 'test') notes.push('demo/test sayfası');
    if (/-2$/.test(page.slug)) notes.push('legacy duplicate sayfa');
    inventory.push([
      'page', page.title_tr, page.slug, page.source_url,
      page.title_en ? 'tr+en' : 'tr', '', '', '0', notes.join('; '),
    ]);
  }
  await writeCsv(
    path.join(OUT.docs, 'content-inventory.csv'),
    ['type', 'title', 'slug', 'url', 'lang', 'sector', 'status', 'image_count', 'notes'],
    inventory,
  );

  const redirects = [];
  for (const entry of canonical) {
    const project = entry.json;
    const oldSlugs = [project.legacy_slug, ...entry.raw.duplicate_legacy_slugs].filter(Boolean);
    for (const oldSlug of new Set(oldSlugs)) {
      redirects.push([`/portfolio/${oldSlug}/`, `/projeler/${project.slug}/`, '301']);
    }
  }
  for (const entry of news) {
    if (entry.raw.slug_needs_fix) {
      redirects.push([`/${entry.raw.legacy_slug}/`, `/${entry.json.slug}/`, '301']);
    }
  }
  const pageRedirects = [
    ['/insaat-2/', '/sektorler/insaat/', '301'],
    ['/enerji/', '/sektorler/enerji/', '301'],
    ['/dogal-gaz-dagitim/', '/sektorler/dogalgaz-dagitim/', '301'],
    ['/sanayi/', '/sektorler/sanayi/', '301'],
    ['/gida/', '/sektorler/gida/', '301'],
    ['/turizm/', '/sektorler/turizm/', '301'],
    ['/hakkimizda/', '/grup/hakkimizda/', '301'],
    ['/uyeliklerimiz/', '/grup/uyelikler/', '301'],
    ['/kalite-belgelerimiz/', '/grup/kalite-belgeleri/', '301'],
    ['/politikalarimiz/', '/grup/politikalar/', '301'],
    ['/bilgi-toplumu-hizmetleri/', '/grup/bilgi-toplumu/', '301'],
    ['/insan-kaynaklari/', '/kariyer/', '301'],
    ['/ik/', '/kariyer/', '301'],
    ['/diyargaz-ik/', '/kariyer/', '301'],
    ['/tamamlanan-projeler/', '/projeler/', '301'],
    ['/tamamlanan-projeler-2/', '/projeler/', '301'],
    ['/devam-eden-projeler/', '/projeler/', '301'],
    ['/devam-eden-projeler-2/', '/projeler/', '301'],
  ];
  redirects.push(...pageRedirects);
  await writeCsv(
    path.join(OUT.docs, 'redirects.csv'),
    ['old_path', 'new_path', 'status'],
    redirects,
  );

  // --- TODO -------------------------------------------------------------
  await writeTodo({
    canonical,
    rawPortfolio,
    merged,
    news,
    newsRaw,
    pagesRaw,
    failedPortfolio,
    imageReport,
    inventory,
  });

  // --- summary ----------------------------------------------------------
  const counts = {
    pages: pagesRaw.length,
    projects: canonical.length,
    projects_raw: rawPortfolio.length,
    projects_failed: failedPortfolio.length,
    projects_merged: merged.length,
    news: news.length,
    sectors: sectorsRaw.length,
    redirects: redirects.length,
    images: imageReport?.downloaded ?? null,
  };
  const summary = {
    generated_at: new Date().toISOString(),
    duration_seconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
    counts,
    projects_with_cover: canonical.filter((entry) => entry.json.cover).length,
    projects_missing_en: canonical.filter((entry) => !entry.json.title_en).length,
    news_missing_en: news.filter((entry) => !entry.json.title_en).length,
    pages_missing_en: pagesRaw.filter((page) => !page.title_en).length,
    ambiguous_sectors: canonical.filter((entry) => entry.json.sector === 'diger').map((entry) => entry.json.slug),
  };
  await writeJson(path.join(OUT.raw, 'import-summary.json'), summary);
  // Görsel pipeline atlandıysa önceki medya denetimini silme.
  if (imageReport?.media) await writeJson(path.join(OUT.raw, 'media.json'), imageReport.media);

  console.log('Import complete.');
  console.log(JSON.stringify(summary, null, 2));
}

function pageTemplate(slug) {
  const map = {
    hakkimizda: 'about',
    uyeliklerimiz: 'memberships',
    'kalite-belgelerimiz': 'certificates',
    'bilgi-toplumu-hizmetleri': 'corporate-info',
    politikalarimiz: 'policies',
    iletisim: 'contact',
    ik: 'careers',
    'insan-kaynaklari': 'careers',
    'diyargaz-ik': 'careers',
    projeler: 'projects-index',
    'tamamlanan-projeler': 'projects-index',
    'devam-eden-projeler': 'projects-index',
    'tamamlanan-projeler-2': 'projects-index',
    'devam-eden-projeler-2': 'projects-index',
    enerji: 'sector',
    'insaat-2': 'sector',
    'dogal-gaz-dagitim': 'sector',
    sanayi: 'sector',
    gida: 'sector',
    turizm: 'sector',
    haberler: 'news-index',
    'ana-sayfa': 'home',
    test: 'test',
  };
  return map[slug] || 'default';
}

async function writeTodo({ canonical, rawPortfolio, merged, news, newsRaw, pagesRaw, failedPortfolio, imageReport }) {
  const lines = [];
  const add = (value = '') => lines.push(value);

  add('# İçerik Göçü TODO');
  add('');
  add(`> Otomatik üretildi: ${new Date().toISOString()} — \`scripts/import-wordpress.mjs\``);
  add('> Kaynak: https://www.fernas.com.tr (WP REST + sitemap + HTML)');
  add('');

  add('## 1. Demo / spam görünen post slug\'ları');
  add('');
  add('Bu kayıtların gövdesi gerçek kurumsal haber içeriyor; yalnızca slug\'ları demo içerikten kalma. Silinmediler, Türkçe başlıktan okunabilir slug üretildi. Eski URL → yeni URL 301 olarak `docs/redirects.csv` içinde.');
  add('');
  const demoPosts = newsRaw.filter((row) => row.demo_slug);
  if (demoPosts.length) {
    add('| Eski slug | Yeni slug | Başlık |');
    add('|---|---|---|');
    for (const row of demoPosts) {
      const item = news.find((entry) => entry.raw.id === row.id);
      add(`| \`${row.legacy_slug}\` | \`${item?.json.slug || ''}\` | ${row.title_tr} |`);
    }
  } else {
    add('Yok.');
  }
  add('');
  add('`/test/` sayfası demo/test içeriği taşıyor; sayfa JSON\'u denetim için tutuldu, yayına alınmamalı.');
  add('');

  add('## 2. Birleştirilen / tekrar eden projeler');
  add('');
  if (merged.length) {
    add('| Canonical slug | Birleşen legacy slug | Kaynak |');
    add('|---|---|---|');
    for (const row of merged) {
      add(`| \`${row.canonical_slug}\` | \`${row.legacy_slug}\` | ${row.source_url} |`);
    }
  } else {
    add('Aynı başlık + aynı görsel ile eşleşen kayıt bulunamadı.');
  }
  add('');
  add('Aynı başlık fakat farklı kapak görseli olan kayıtlar ayrı proje kabul edildi.');
  add('');

  add('## 3. Eksik İngilizce');
  add('');
  const missingEnProjects = canonical.filter((entry) => !entry.json.title_en);
  const missingEnNews = news.filter((entry) => !entry.json.title_en);
  const missingEnPages = pagesRaw.filter((page) => !page.title_en);
  add(`- Projeler: ${missingEnProjects.length}/${canonical.length}${missingEnProjects.length ? ` — ${missingEnProjects.map((entry) => `\`${entry.json.slug}\``).join(', ')}` : ''}`);
  add(`- Haberler: ${missingEnNews.length}/${news.length}${missingEnNews.length ? ` — ${missingEnNews.map((entry) => `\`${entry.json.slug}\``).join(', ')}` : ''}`);
  add(`- Sayfalar: ${missingEnPages.length}/${pagesRaw.length}${missingEnPages.length ? ` — ${missingEnPages.map((page) => `\`${page.slug}\``).join(', ')}` : ''}`);
  add('');
  add('Boş bırakılan EN alanları uydurma çeviri ile doldurulmadı.');
  add('');

  add('## 4. Düşük çözünürlüklü görseller');
  add('');
  let lowRes = imageReport?.lowRes || [];
  if (!lowRes.length) {
    // `--no-images` ile çalıştırıldığında önceki görsel raporundan oku.
    try {
      const report = JSON.parse(await fs.readFile(path.join(OUT.raw, 'image-report.json'), 'utf8'));
      lowRes = report.lowRes || [];
    } catch {
      try {
        const media = JSON.parse(await fs.readFile(path.join(OUT.raw, 'media.json'), 'utf8'));
        lowRes = media
          .filter((row) => row.low_res)
          .map((row) => ({
            slug: `${row.owner_type}/${row.owner_slug}`,
            width: row.width,
            url: row.source_url,
            role: row.role,
          }));
      } catch {
        lowRes = [];
      }
    }
  }
  if (lowRes.length) {
    add('| Slug | Kaynak genişliği | Kaynak |');
    add('|---|---|---|');
    for (const row of lowRes.slice(0, 100)) add(`| \`${row.slug}\` | ${row.width}px | ${row.url} |`);
    if (lowRes.length > 100) add(`| … | ${lowRes.length - 100} kayıt daha | |`);
  } else {
    add('Tespit edilen düşük çözünürlüklü görsel yok (veya görsel indirme atlandı).');
  }
  add('');

  add('## 5. Kırık / şüpheli bağlantılar');
  add('');
  add('- **Kozbükü HES haberi Sebenoba URL\'sinde:** `/hatay-sebenoba-ruzgar-santrali-anlasmasi/` başlığı "Ordu Kozbükü Hidroelektrik Santrali Anlaşması". İçerik doğru, URL yanlış. Haber kaydı yeni slug ile üretildi; eski URL korunmalı.');
  add('- **Kozbükü projesi:** `/portfolio/kozbuku-hidroelektrik-santrali/` ayrı proje kaydı olarak duruyor.');
  add('- İletişim sayfasındaki e-posta Cloudflare e-posta koruması nedeniyle `[email protected]` olarak görünüyor; gerçek adres HTML\'de yok.');
  add('- Politika metinleri PDF bağlantıları halinde; PDF\'ler indirilmedi. Yayına alınacaksa PDF\'ler ayrıca `public/` altına alınmalı.');
  if (failedPortfolio.length) {
    add('');
    add(`- Scrape edilemeyen ${failedPortfolio.length} portfolyo URL\'si:`);
    for (const row of failedPortfolio) add(`  - ${row.source_url || row.legacy_slug} (${row.error})`);
  }
  add('');

  add('## 6. Telefon / e-posta çelişkileri');
  add('');
  add('- Kaynak sitede iki telefon görülüyor: `+90 312 454 16 00` ve `+90 312 426 6262`.');
  add('- Footer\'da `+90 (312) 426 6262`, bazı sayfalarda `+90 312 454 16 00` kullanılıyor. Hangisinin güncel olduğu doğrulanmalı.');
  add('- Faks: `+90 (312) 426 3838`. E-posta adresi HTML\'de gizli.');
  add('');

  add('## 7. Belirsiz sektörler');
  add('');
  const ambiguous = canonical.filter((entry) => entry.json.sector === 'diger');
  if (ambiguous.length) {
    for (const entry of ambiguous) add(`- \`${entry.json.slug}\` — ${entry.json.title_tr} (${entry.json.source_url})`);
  } else {
    add('Tüm projeler altı sektörden birine atandı.');
  }
  add('');

  add('## 8. Görsel notları');
  add('');
  add('- Proje sayfalarında ayrı galeri yok; çoğu projede tek kapak görseli var. Galeri alanları bu yüzden çoğunlukla boş.');
  add('- Aynı görsel birden fazla projede kullanılıyor olabilir; `data/raw/media.json` içinde kaynak URL\'leri karşılaştırılabilir.');
  add('- Görseller 800/1600 px WebP olarak üretildi; kaynak 800 px\'den küçükse `low_res: true`.');
  add('- Sektör görselleri ilgili sektör sayfasındaki ilk yüksek çözünürlüklü görselden alındı.');
  add('');

  add('## 9. Sayfa / içerik notları');
  add('');
  add('- WP REST `pages` içeriği çoğu sayfada boş (Zion Builder); sayfa gövdeleri HTML\'den çıkarıldı.');
  add('- `tamamlanan-projeler-2` ve `devam-eden-projeler-2` sayfaları eski/duplike varyantlar.');
  add('- `insan-kaynaklari`, `ik` ve `diyargaz-ik` sayfaları aynı işe alım içeriğini farklı biçimlerde taşıyor.');
  add('- Hukuki/politika metinleri HTML\'den birebir alındı; yalnızca script/style/sosyal medya blokları ve sunum attribute\'ları temizlendi.');
  add('- 2018 sonrası yeni haber bulunmuyor; en yeni yayın tarihi 2018-02-08.');
  add('');

  add('## 10. Sonraki adımlar');
  add('');
  add('- `docs/redirects.csv` içindeki sayfa yönlendirmelerini Astro rotalarıyla doğrula.');
  add('- Görsel alt metinlerini gerçek sahne bilgisiyle zenginleştir (şu an başlık + sektör + şehir).');
  add('- Politikaların PDF\'lerini indirip `public/belgeler/` altına koy.');
  add('- Kozbükü haberinin URL\'sini düzelt ve eski URL\'yi 301 ile yönlendir.');
  add('- İletişim bilgilerini (telefon/e-posta) teyit et.');
  add('');

  await fs.mkdir(OUT.docs, { recursive: true });
  await fs.writeFile(path.join(ROOT, 'data/TODO.md'), `${lines.join('\n')}\n`, 'utf8');
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});
