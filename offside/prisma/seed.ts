import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.match.createMany({
    data: [
      { id: "wc2026-g1-m1", competition: "WC", homeTeam: "Brazil", awayTeam: "Argentina", round: "Group A", kickoff: new Date("2026-06-14T18:00:00Z") },
      { id: "wc2026-g1-m2", competition: "WC", homeTeam: "France", awayTeam: "England", round: "Group B", kickoff: new Date("2026-06-15T21:00:00Z") },
    ],
    skipDuplicates: true,
  });
  console.log("Seeded matches");
}

main().finally(() => prisma.$disconnect());
