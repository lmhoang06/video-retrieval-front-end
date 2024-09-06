import translate from "google-translate-api-x";

export async function POST(request) {
  // Parse the request body to get the user-supplied object
  const body = await request.json();

  const res = await translate(body.text, { to: 'en', client: 'gtx' });

  return new Response(JSON.stringify(res.text), { status: 200 });
}
