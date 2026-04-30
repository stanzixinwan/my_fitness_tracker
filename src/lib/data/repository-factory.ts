import { getPrisma } from "@/lib/db/prisma";
import type { FitnessRepository } from "@/lib/data/repository";
import { PrismaRepository } from "@/lib/data/repositories/prisma-repository";
import { SampleRepository } from "@/lib/data/repositories/sample-repository";

let sampleRepository: SampleRepository | undefined;

export function getFitnessRepository(): FitnessRepository {
  const prisma = getPrisma();

  if (prisma) {
    return new PrismaRepository(prisma);
  }

  sampleRepository ??= new SampleRepository();
  return sampleRepository;
}
