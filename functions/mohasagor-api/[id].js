export async function onRequest(context) {
  const { request, params, next } = context;
  const ua = request.headers.get("user-agent") || "";

  const isBot = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|Googlebot|bingbot|vkShare|SkypeUriPreview/i.test(ua);

  // সাধারণ ইউজার হলে React app স্বাভাবিকভাবে সার্ভ হবে
  if (!isBot) {
    return next();
  }

  const id = params.id;
  const BACKEND_URL = "https://shazadhossain-ih61-ma5.tail72a7a3.ts.net";

  let product = null;
  try {
    const res = await fetch(`${BACKEND_URL}/product/${id}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    if (res.ok) product = await res.json();
  } catch (e) {
    // fetch fail হলে ডিফল্ট OG-ই থাকবে
  }

  const originResponse = await next();
  if (!product) return originResponse;

  const title = (product.title || product.name || "ONE-SHOP") + " — ONE-SHOP";
  const rawDesc = (product.description || "").replace(/<[^>]*>/g, "").trim();
  const description = (rawDesc.slice(0, 160) || "ONE-SHOP এ এই প্রোডাক্টটি দেখুন — Cash on Delivery ও Free Shipping সুবিধাসহ।");
  const image = product.image || product.thumbnail_img || "https://i.postimg.cc/1zWZfCtG/Gemini-Generated-Image-w5no2ww5no2ww5no-Photoroom.png";
  const url = `https://oneshop.pre.bd/product/${id}`;

  class MetaTag {
    constructor(value) { this.value = value; }
    element(element) { element.setAttribute("content", this.value); }
  }
  class TitleTag {
    constructor(value) { this.value = value; }
    element(element) { element.setInnerContent(this.value); }
  }

  return new HTMLRewriter()
    .on('title', new TitleTag(title))
    .on('meta[property="og:title"]', new MetaTag(title))
    .on('meta[name="twitter:title"]', new MetaTag(title))
    .on('meta[property="og:description"]', new MetaTag(description))
    .on('meta[name="twitter:description"]', new MetaTag(description))
    .on('meta[property="og:image"]', new MetaTag(image))
    .on('meta[property="og:image:secure_url"]', new MetaTag(image))
    .on('meta[name="twitter:image"]', new MetaTag(image))
    .on('meta[property="og:url"]', new MetaTag(url))
    .on('meta[name="twitter:url"]', new MetaTag(url))
    .transform(originResponse);
}
