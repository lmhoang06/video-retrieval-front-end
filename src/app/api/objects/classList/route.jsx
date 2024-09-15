import { prisma } from "@/app/api/objects/database";

export async function GET() {
  let classNames = await prisma.objects.groupBy({
    by: ["className"],
    _count: {
      frameId: true,
    },
  });

  classNames = classNames.map(({ className, _count: { frameId: count } }) => ({
    className: className,
    count: count,
  }));

  return new Response(JSON.stringify(classNames), { status: 200 });
}
