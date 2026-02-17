import { PrismaClient } from "@prisma/client";
import { calculateDiscount, calculateDiscountedPrice } from "../lib/discount";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Rebookd database...\n");

  // ── Clean slate ──────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.service.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.business.deleteMany();

  console.log("  ✓ Cleared existing marketplace data");

  // ── Business owner users ─────────────────────────────
  // (We upsert so we don't collide with existing auth users)

  const ownerSalon = await prisma.user.upsert({
    where: { email: "owner@glow-studio.test" },
    update: {},
    create: {
      email: "owner@glow-studio.test",
      name: "Maya Johnson",
      role: "BUSINESS",
      emailVerified: new Date(),
      lat: 40.7484,
      lng: -73.9857,
    },
  });

  const ownerGym = await prisma.user.upsert({
    where: { email: "owner@iron-forge.test" },
    update: {},
    create: {
      email: "owner@iron-forge.test",
      name: "Marcus Chen",
      role: "BUSINESS",
      emailVerified: new Date(),
      lat: 40.7580,
      lng: -73.9855,
    },
  });

  const ownerDental = await prisma.user.upsert({
    where: { email: "owner@bright-smile.test" },
    update: {},
    create: {
      email: "owner@bright-smile.test",
      name: "Dr. Sarah Patel",
      role: "BUSINESS",
      emailVerified: new Date(),
      lat: 40.7549,
      lng: -73.9840,
    },
  });

  const ownerSpa = await prisma.user.upsert({
    where: { email: "owner@zen-retreat.test" },
    update: {},
    create: {
      email: "owner@zen-retreat.test",
      name: "Aiko Tanaka",
      role: "BUSINESS",
      emailVerified: new Date(),
      lat: 40.7425,
      lng: -73.9884,
    },
  });

  const ownerYoga = await prisma.user.upsert({
    where: { email: "owner@flow-yoga.test" },
    update: {},
    create: {
      email: "owner@flow-yoga.test",
      name: "Priya Sharma",
      role: "BUSINESS",
      emailVerified: new Date(),
      lat: 40.7437,
      lng: -73.9910,
    },
  });

  console.log("  ✓ Created 5 business owner users");

  // ── Businesses ───────────────────────────────────────

  const salon = await prisma.business.create({
    data: {
      ownerId: ownerSalon.id,
      name: "Glow Studio",
      slug: "glow-studio",
      description:
        "Premium hair and beauty salon in Midtown Manhattan. Specializing in cuts, color, and styling.",
      category: "SALON",
      address: "350 5th Ave",
      city: "New York",
      state: "NY",
      zip: "10118",
      lat: 40.7484,
      lng: -73.9857,
      phone: "+12125551001",
      avgRating: 4.7,
      verified: true,
    },
  });

  const gym = await prisma.business.create({
    data: {
      ownerId: ownerGym.id,
      name: "Iron Forge Fitness",
      slug: "iron-forge-fitness",
      description:
        "Hardcore gym with personal training, HIIT classes, and strength programs.",
      category: "FITNESS",
      address: "1585 Broadway",
      city: "New York",
      state: "NY",
      zip: "10036",
      lat: 40.7580,
      lng: -73.9855,
      phone: "+12125551002",
      avgRating: 4.5,
      verified: true,
    },
  });

  const dental = await prisma.business.create({
    data: {
      ownerId: ownerDental.id,
      name: "Bright Smile Dental",
      slug: "bright-smile-dental",
      description:
        "Modern dental practice offering cleanings, whitening, and cosmetic dentistry.",
      category: "DENTAL",
      address: "11 W 42nd St",
      city: "New York",
      state: "NY",
      zip: "10036",
      lat: 40.7549,
      lng: -73.9840,
      phone: "+12125551003",
      avgRating: 4.8,
      verified: true,
    },
  });

  const spa = await prisma.business.create({
    data: {
      ownerId: ownerSpa.id,
      name: "Zen Retreat Spa",
      slug: "zen-retreat-spa",
      description:
        "Relaxation and therapeutic massage in a tranquil setting near Herald Square.",
      category: "SPA",
      address: "1293 Broadway",
      city: "New York",
      state: "NY",
      zip: "10001",
      lat: 40.7425,
      lng: -73.9884,
      phone: "+12125551004",
      avgRating: 4.9,
      verified: true,
    },
  });

  const yoga = await prisma.business.create({
    data: {
      ownerId: ownerYoga.id,
      name: "Flow Yoga Studio",
      slug: "flow-yoga-studio",
      description:
        "Vinyasa, hot yoga, and meditation classes for all levels.",
      category: "YOGA",
      address: "27 W 24th St",
      city: "New York",
      state: "NY",
      zip: "10010",
      lat: 40.7437,
      lng: -73.9910,
      phone: "+12125551005",
      avgRating: 4.6,
      verified: true,
    },
  });

  console.log("  ✓ Created 5 businesses (Salon, Gym, Dental, Spa, Yoga)");

  // ── Services ─────────────────────────────────────────

  const services = await Promise.all([
    // Salon services
    prisma.service.create({
      data: {
        businessId: salon.id,
        name: "Women's Haircut & Blowout",
        category: "SALON",
        durationMinutes: 60,
        originalPrice: 85.0,
        description: "Full haircut with wash, blowout, and styling.",
      },
    }),
    prisma.service.create({
      data: {
        businessId: salon.id,
        name: "Men's Haircut",
        category: "SALON",
        durationMinutes: 30,
        originalPrice: 45.0,
      },
    }),
    prisma.service.create({
      data: {
        businessId: salon.id,
        name: "Balayage Color",
        category: "SALON",
        durationMinutes: 120,
        originalPrice: 250.0,
        description: "Hand-painted highlights for a natural, sun-kissed look.",
      },
    }),

    // Gym services
    prisma.service.create({
      data: {
        businessId: gym.id,
        name: "Personal Training Session",
        category: "FITNESS",
        durationMinutes: 60,
        originalPrice: 100.0,
        description: "One-on-one session with a certified trainer.",
      },
    }),
    prisma.service.create({
      data: {
        businessId: gym.id,
        name: "HIIT Group Class",
        category: "FITNESS",
        durationMinutes: 45,
        originalPrice: 30.0,
      },
    }),

    // Dental services
    prisma.service.create({
      data: {
        businessId: dental.id,
        name: "Dental Cleaning",
        category: "DENTAL",
        durationMinutes: 45,
        originalPrice: 150.0,
        description: "Professional cleaning with exam and X-rays.",
      },
    }),
    prisma.service.create({
      data: {
        businessId: dental.id,
        name: "Teeth Whitening",
        category: "DENTAL",
        durationMinutes: 60,
        originalPrice: 350.0,
      },
    }),

    // Spa services
    prisma.service.create({
      data: {
        businessId: spa.id,
        name: "60-min Deep Tissue Massage",
        category: "SPA",
        durationMinutes: 60,
        originalPrice: 120.0,
        description: "Therapeutic deep tissue massage targeting tension and knots.",
      },
    }),
    prisma.service.create({
      data: {
        businessId: spa.id,
        name: "90-min Hot Stone Massage",
        category: "SPA",
        durationMinutes: 90,
        originalPrice: 180.0,
      },
    }),

    // Yoga services
    prisma.service.create({
      data: {
        businessId: yoga.id,
        name: "Vinyasa Flow Class",
        category: "YOGA",
        durationMinutes: 60,
        originalPrice: 25.0,
      },
    }),
    prisma.service.create({
      data: {
        businessId: yoga.id,
        name: "Hot Yoga Session",
        category: "YOGA",
        durationMinutes: 75,
        originalPrice: 30.0,
        description: "Heated room (105°F) power yoga for flexibility and detox.",
      },
    }),
  ]);

  console.log(`  ✓ Created ${services.length} services across all businesses`);

  // ── Cancellations (live deals!) ──────────────────────

  const now = new Date();
  const hour = 60 * 60 * 1000;

  // Helper to create cancellation with dynamic discount
  async function createCancellation(
    serviceIndex: number,
    businessId: string,
    hoursFromNow: number,
    durationMinutes: number,
    minDiscount = 10,
    maxDiscount = 50
  ) {
    const service = services[serviceIndex];
    const startTime = new Date(now.getTime() + hoursFromNow * hour);
    const endTime = new Date(
      startTime.getTime() + durationMinutes * 60 * 1000
    );
    const discountPercent = calculateDiscount(
      startTime,
      minDiscount,
      maxDiscount,
      now
    );
    const discountedPrice = calculateDiscountedPrice(
      Number(service.originalPrice),
      discountPercent
    );

    return prisma.cancellation.create({
      data: {
        businessId,
        serviceId: service.id,
        originalStartTime: startTime,
        originalEndTime: endTime,
        discountPercent,
        discountedPrice,
        status: "AVAILABLE",
        minDiscount,
        maxDiscount,
        expiresAt: startTime,
      },
    });
  }

  const cancellations = await Promise.all([
    // Salon — slot in 2 hours
    createCancellation(0, salon.id, 2, 60),
    // Salon — slot in 45 minutes
    createCancellation(1, salon.id, 0.75, 30),
    // Gym — personal training in 5 hours
    createCancellation(3, gym.id, 5, 60),
    // Gym — HIIT class in 1.5 hours
    createCancellation(4, gym.id, 1.5, 45),
    // Dental — cleaning tomorrow
    createCancellation(5, dental.id, 26, 45),
    // Spa — massage in 3 hours
    createCancellation(7, spa.id, 3, 60),
    // Spa — hot stone in 8 hours
    createCancellation(8, spa.id, 8, 90),
    // Yoga — vinyasa in 1 hour
    createCancellation(9, yoga.id, 1, 60),
    // Yoga — hot yoga in 4 hours
    createCancellation(10, yoga.id, 4, 75),
  ]);

  console.log(`  ✓ Created ${cancellations.length} cancellation slots with dynamic pricing`);

  // ── Test consumer user ───────────────────────────────

  const consumer = await prisma.user.upsert({
    where: { email: "test@consumer.test" },
    update: {},
    create: {
      email: "test@consumer.test",
      name: "Alex Rivera",
      role: "CONSUMER",
      emailVerified: new Date(),
      lat: 40.7505,
      lng: -73.9870,
      searchRadius: 10,
    },
  });

  // Set consumer preferences
  await prisma.userPreference.createMany({
    data: [
      { userId: consumer.id, category: "SALON", enabled: true },
      { userId: consumer.id, category: "YOGA", enabled: true },
      { userId: consumer.id, category: "SPA", enabled: true },
      { userId: consumer.id, category: "DENTAL", enabled: false },
    ],
  });

  // Watchlist some businesses
  await prisma.watchlist.createMany({
    data: [
      { userId: consumer.id, businessId: salon.id },
      { userId: consumer.id, businessId: spa.id },
    ],
  });

  console.log("  ✓ Created test consumer with preferences and watchlist");

  // ── Summary ──────────────────────────────────────────
  console.log("\n🎉 Seed complete!\n");
  console.log("  Businesses:     5");
  console.log(`  Services:       ${services.length}`);
  console.log(`  Cancellations:  ${cancellations.length}`);
  console.log("  Consumer:       1 (test@consumer.test)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
