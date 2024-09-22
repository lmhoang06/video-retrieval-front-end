import objectsQuery from "./processObjectQuery";

export async function POST(request) {
  return new Response(
    JSON.stringify(await objectsQuery(await request.json())),
    { status: 200 }
  );
}
