// Seed a few teammates if the table is empty.
// Runs as part of database sync via embr.yaml.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedData = [
  { name: 'Ada Lovelace', role: 'Founding engineer', status: 'available', message: 'Heads-down on the analytical engine' },
  { name: 'Grace Hopper', role: 'CTO', status: 'busy', message: 'In a compiler meeting' },
  { name: 'Alan Turing', role: 'Research lead', status: 'focus', message: 'Decoding things' },
  { name: 'Hedy Lamarr', role: 'Comms', status: 'ooo', message: 'On set' },
];

async function main() {
  const existing = await prisma.teammate.count();
  if (existing > 0) {
    console.log(`Seed skipped — ${existing} teammates already present.`);
    return;
  }
  for (const t of seedData) {
    await prisma.teammate.create({ data: t });
  }
  console.log(`Seeded ${seedData.length} teammates.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
