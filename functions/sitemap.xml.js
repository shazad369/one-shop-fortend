export async function onRequest(context) {
  const { request } = context;
  const BACKEND_URL = "https://debian.tail72a7a3.ts.net";
  const API_KEY = "one-shop-secret-key-change-this";
  const SITE_URL = "https://oneshop.pre.bd";

  // ✅ Cron worker theke asa force-refresh request check kora
  const REFRESH_SECRET = "one-shop-cron-refresh-2026";
  const url = new URL(request.url);
  const isForceRefresh = url.searchParams.get("refresh") === REFRESH_SECRET;

  // ✅ Canonical cache key - refresh param bade
  const canonicalUrl = `${SITE_URL}/sitemap.xml`;
  const cache = caches.default;
  const cacheKey = new Request(canonicalUrl, request);

  if (!isForceRefresh) {
    let cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // ✅ Per page e 200 ta product - eta guruttopurno!
  // Cloudflare Free plan e ekta invocation e max 50 ta subrequest (fetch call) pathano jay.
  // 5705 ta product / 200 per page = maximum 29 ta request lagbe, tai eta 50 er niche thakbe.
  const LIMIT = 200;
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;
  const REQUEST_DELAY_MS = 250;
  const MAX_PAGES = 40; // safety limit (40 * 200 = 8000 products - egiye rakha holo)

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function fetchPage(page) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // ✅ limit=${LIMIT} pathano hocche, tai backend proti page e 200 ta product dibe
        const res = await fetch(`${BACKEND_URL}/shopdata?page=${page}&limit=${LIMIT}`, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (res.ok) {
          const data = await res.json();
          return data.products || data.data || (Array.isArray(data) ? data : []);
        }
        console.log(`Page ${page} failed with status ${res.status}, attempt ${attempt}/${MAX_RETRIES}`);
      } catch (e) {
        console.log(`Page ${page} fetch error: ${e.message}, attempt ${attempt}/${MAX_RETRIES}`);
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
    return null;
  }

  let allIds = [];
  let page = 1;
  let hasMore = true;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 5;

  try {
    while (hasMore && page <= MAX_PAGES) {
      const products = await fetchPage(page);

      if (products === null) {
        consecutiveFailures++;
        console.log(`Skipping page ${page} after ${MAX_RETRIES} failed retries`);

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`Stopping: ${MAX_CONSECUTIVE_FAILURES} consecutive page failures`);
          hasMore = false;
          break;
        }

        page++;
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      consecutiveFailures = 0;

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      products.forEach((p) => {
        if (p.id) allIds.push(p.id);
      });

      if (products.length < LIMIT) {
        hasMore = false;
      }

      page++;

      if (hasMore) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  } catch (e) {
    console.log(`Sitemap generation error: ${e.message}`);
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
      // ✅ 7 din cache - cron worker proti 7 din e nijei force-refresh kore
      "Cache-Control": "public, max-age=604800, s-maxage=604800",
    },
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
