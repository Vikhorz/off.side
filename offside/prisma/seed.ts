import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Only seed demo data in development, not in production
  if (process.env.NODE_ENV !== "production") {
    await prisma.match.createMany({
      data: [
        { id: "demo-pd-1", competition: "PD", homeTeam: "Real Madrid", awayTeam: "Barcelona", round: "Matchday 1", kickoff: new Date("2026-08-16T20:00:00Z") },
        { id: "demo-pl-1", competition: "PL", homeTeam: "Manchester United", awayTeam: "Liverpool", round: "Matchday 1", kickoff: new Date("2026-08-22T15:00:00Z") },
      ],
    });
    console.log("Seeded demo matches");
  } else {
    console.log("Skipping demo data seeding in production");
  }
}

main().finally(() => prisma.$disconnect());
