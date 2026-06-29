export async function onRequest({ request, params }) {
  const path = params.path ? params.path.join("/") : "";
  const url = new URL(request.url);
  
  const response = await fetch(
    `https://mohasagor.com.bd/api/${path}${url.search}`,
    {
      headers: {
        "api-key": "A8niclztH9JtzS4t",
        "secret-key": "2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8",
      },
    }
  );
  
  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
