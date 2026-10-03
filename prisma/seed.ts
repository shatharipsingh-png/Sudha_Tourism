import { PrismaClient, RoleName, Difficulty, Season } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- Roles ---
  const roleNames: RoleName[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "SUPPORT", "CUSTOMER"];
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // --- Categories ---
  const categories = ["Trekking", "Pilgrimage", "Adventure", "Group Departures", "Corporate Tours", "Custom Trips"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
  }

  // --- Sample destination ---
  const destination = await prisma.destination.upsert({
    where: { slug: "valley-of-flowers" },
    update: {},
    create: {
      name: "Valley of Flowers",
      slug: "valley-of-flowers",
      region: "Uttarakhand",
      bestSeason: Season.MONSOON,
      description: "A UNESCO World Heritage site famed for its alpine flora.",
    },
  });

  const trekking = await prisma.category.findUnique({ where: { name: "Trekking" } });

  // --- Sample package ---
  await prisma.package.upsert({
    where: { slug: "valley-of-flowers-trek" },
    update: {},
    create: {
      title: "Valley of Flowers Trek",
      slug: "valley-of-flowers-trek",
      summary: "A 6-day monsoon trek through one of the Himalayas' most beautiful valleys.",
      priceAmount: 1499900,
      durationDays: 6,
      durationNights: 5,
      difficulty: Difficulty.MODERATE,
      season: Season.MONSOON,
      isPublished: true,
      isFeatured: true,
      categoryId: trekking?.id,
      destinations: { connect: [{ id: destination.id }] },
      inclusions: ["Accommodation", "All meals", "Trek permits", "Guide"],
      exclusions: ["Personal expenses", "Travel insurance"],
      packingList: ["Trekking shoes", "Rain gear", "Warm layers"],
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
