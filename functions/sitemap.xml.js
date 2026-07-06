export async function onRequest(context) {
  // তোমার backend theke shob product fetch koro
  const response = await fetch('https://debian.tail72a7a3.ts.net/shopdata');
  const products = await response.json();

  const urls = products.map(p => `
    <url>
      <loc>https://oneshop.pre.bd/product/${p._id}</loc>
      <priority>0.8</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://oneshop.pre.bd/</loc><priority>1.0</priority></url>
  ${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" }
  });
}
