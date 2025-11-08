// worker.js
import { parentPort } from 'worker_threads';
import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { readdir, stat } from 'fs/promises';


// Operation handlers
const operations = {
  'generate-html': generateHTML,
  'generate-index': generateIndex,
  'copy-file': copyFileOp,
  'optimize-image': optimizeImage,
  'generate-rss': generateRSS,
  'generate-sitemap': generateSitemap
};

// Main message handler
parentPort.on('message', async (task) => {
  try {
    const handler = operations[task.type];

    if (!handler) {
      throw new Error(`Unknown task type: ${task.type}`);
    }

    const result = await handler(task);

    parentPort.postMessage({
      success: true,
      type: task.type,
      output: task.output,
      ...result
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
      type: task.type,
      input: task.input
    });
  }
});

// Generate HTML from JSON
async function generateHTML(task) {
  const json = await readFile(task.input, 'utf8');
  const data = JSON.parse(json);
  const template = await readFile(task.template, 'utf8');

  // Simple template replacement
  let html = template
    .replace('{{title}}', escapeHtml(data.title))
    .replace('{{content}}', data.content)
    .replace('{{date}}', new Date(data.date).toLocaleDateString())
    .replace('{{author}}', escapeHtml(data.author || 'Anonymous'));

  await mkdir(path.dirname(task.output), { recursive: true });
  await writeFile(task.output, html, 'utf8');

  return { bytes: html.length };
}

// Generate index page
async function generateIndex(task) {
  const files = await readdir(task.input);
  const posts = [];

  for (const file of files.filter(f => f.endsWith('.json'))) {
    const content = await readFile(path.join(task.input, file), 'utf8');
    const data = JSON.parse(content);
    posts.push({
      title: data.title,
      date: data.date,
      slug: file.replace('.json', ''),
      excerpt: data.excerpt || data.content.substring(0, 200)
    });
  }

  // Sort by date
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const template = await readFile(task.template, 'utf8');

  const postsList = posts.map(p => `
    <article>
      <h2><a href="/posts/${p.slug}.html">${escapeHtml(p.title)}</a></h2>
      <time>${new Date(p.date).toLocaleDateString()}</time>
      <p>${escapeHtml(p.excerpt)}</p>
    </article>
  `).join('\n');

  const html = template.replace('{{posts}}', postsList);

  await writeFile(task.output, html, 'utf8');

  return { postsCount: posts.length };
}

// Copy file operation
async function copyFileOp(task) {
  await mkdir(path.dirname(task.output), { recursive: true });
  await copyFile(task.input, task.output);

  const stats = await stat(task.output);
  return { bytes: stats.size };
}

// Optimize image (simplified - you can add sharp or other libraries)
async function optimizeImage(task) {
  // For now, just copy - in production you'd use sharp or similar
  await mkdir(path.dirname(task.output), { recursive: true });
  await copyFile(task.input, task.output);

  // TODO: Add actual image optimization
  // const sharp = require('sharp');
  // await sharp(task.input)
  //   .jpeg({ quality: task.quality })
  //   .toFile(task.output);

  return { optimized: true };
}

// Generate RSS feed
async function generateRSS(task) {
  const files = await readdir(task.input);
  const posts = [];

  for (const file of files.filter(f => f.endsWith('.json'))) {
    const content = await readFile(path.join(task.input, file), 'utf8');
    const data = JSON.parse(content);
    posts.push({
      title: data.title,
      date: data.date,
      slug: file.replace('.json', ''),
      content: data.content
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>My awesome blog</description>
    ${posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>https://example.com/posts/${p.slug}.html</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.content.substring(0, 200))}</description>
    </item>`).join('\n')}
  </channel>
</rss>`;

  await writeFile(task.output, rss, 'utf8');

  return { itemsCount: posts.length };
}

// Generate sitemap
async function generateSitemap(task) {
  const files = await readdir(task.input);
  const posts = [];

  for (const file of files.filter(f => f.endsWith('.json'))) {
    const content = await readFile(path.join(task.input, file), 'utf8');
    const data = JSON.parse(content);
    posts.push({
      slug: file.replace('.json', ''),
      date: data.date
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${task.baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map(p => `
  <url>
    <loc>${task.baseUrl}/posts/${p.slug}.html</loc>
    <lastmod>${new Date(p.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  await writeFile(task.output, sitemap, 'utf8');

  return { urlsCount: posts.length + 1 };
}

// Utilities
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
