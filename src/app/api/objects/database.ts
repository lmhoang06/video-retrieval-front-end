import { PrismaClient } from "@prisma/client-objects";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaObjects: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaObjects ?? prismaClientSingleton();

globalThis.prismaObjects = prisma;
