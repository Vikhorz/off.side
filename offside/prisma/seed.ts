import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.match.createMany({
    data: [
      { id: "demo-pl-1", competition: "PL", homeTeam: "Manchester United", awayTeam: "Liverpool", round: "Matchday 1", kickoff: new Date("2026-08-22T15:00:00Z") },
      { id: "demo-pd-1", competition: "PD", homeTeam: "Real Madrid", awayTeam: "Barcelona", round: "Matchday 1", kickoff: new Date("2026-08-16T20:00:00Z") },
    ],
    skipDuplicates: true,
  });
  console.log("Seeded matches");
}

main().finally(() => prisma.$disconnect());
