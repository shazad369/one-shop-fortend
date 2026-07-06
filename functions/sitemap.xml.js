export async function onRequest(context) {
  const { request } = context;
  const BACKEND_URL = "https://debian.tail72a7a3.ts.net";
  const API_KEY = "one-shop-secret-key-change-this";
  const SITE_URL = "https://oneshop.pre.bd";

  // ✅ Cache check - Cloudflare cache theke age dekhbe age generate kora sitemap ache kina
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  let cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  let allIds = [];
  const LIMIT = 20; // প্রতি page e koyta product ashe (tomar API onujayi)
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch(`${BACKEND_URL}/shopdata?page=${page}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!res.ok) break;

      const data = await res.json();

      // ✅ Backend response structure onujayi products array ber kora
      // Common patterns: data.products, data.data, ba shorasori array
      const products = data.products || data.data || (Array.isArray(data) ? data : []);

      if (!products || products.length === 0) {
        hasMore = false;
        break;
      }

      products.forEach((p) => {
        if (p.id) allIds.push(p.id);
      });

      // Jodi page e product shongkha LIMIT theke kom hoy, tahole eta shesh page
      if (products.length < LIMIT) {
        hasMore = false;
      }

      page++;

      // Safety limit - infinite loop thekano jonno (max 250 pages = 5000 products)
      if (page > 250) break;
    }
  } catch (e) {
    // Backend fetch fail hole empty sitemap na diye already thaka static URLs die response dibo
  }

  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    { loc: `${SITE_URL}/shop`, priority: "0.9" },
  ];

  const productUrls = allIds.map((id) => ({
    loc: `${SITE_URL}/product/${id}`,
    priority: "0.8",
  }));

  const allUrls = [...staticUrls, ...productUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  const response = new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      // ✅ 3 din (259200 seconds) cache thakbe Cloudflare edge e
      "Cache-Control": "public, max-age=259200, s-maxage=259200",
    },
  });

  // ✅ Cache e save kore rakhbe porer visitor der jonno
  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
