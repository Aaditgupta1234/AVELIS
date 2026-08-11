// scripts/generate-sitemap.mjs
// Generates public/sitemap.xml at build time with the actual deployment date.
// Run automatically via the "prebuild" script in package.json:
//   "prebuild": "node scripts/generate-sitemap.mjs"

import { writeFileSync } from 'fs';

const BASE_URL = 'https://avelis-alpha.vercel.app';

// Always reflects the actual build / deploy date — never stale.
const today = new Date().toISOString().split('T')[0];

const urls = [
  { path: '/',            changefreq: 'weekly',  priority: '1.0' },
  { path: '/library',     changefreq: 'daily',   priority: '0.9' },
  { path: '/collections', changefreq: 'weekly',  priority: '0.8' },
  { path: '/journal',     changefreq: 'monthly', priority: '0.7' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ path, changefreq, priority }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('')}
</urlset>`;

writeFileSync('./public/sitemap.xml', xml);
console.log(`✅ sitemap.xml generated with lastmod=${today}`);
