import metadataQuery from "@/components/queryInput/metadataQuery";

export async function POST(request) {
  const body = await request.json();

  return new Response(JSON.stringify(await metadataQuery(body)), {
    status: 200,
  });
}
