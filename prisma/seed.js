"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var discount_1 = require("../lib/discount");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        // Helper to create cancellation with dynamic discount
        function createCancellation(serviceIndex_1, businessId_1, hoursFromNow_1, durationMinutes_1) {
            return __awaiter(this, arguments, void 0, function (serviceIndex, businessId, hoursFromNow, durationMinutes, minDiscount, maxDiscount) {
                var service, startTime, endTime, discountPercent, discountedPrice;
                if (minDiscount === void 0) { minDiscount = 10; }
                if (maxDiscount === void 0) { maxDiscount = 50; }
                return __generator(this, function (_a) {
                    service = services[serviceIndex];
                    startTime = new Date(now.getTime() + hoursFromNow * hour);
                    endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
                    discountPercent = (0, discount_1.calculateDiscount)(startTime, minDiscount, maxDiscount, now);
                    discountedPrice = (0, discount_1.calculateDiscountedPrice)(Number(service.originalPrice), discountPercent);
                    return [2 /*return*/, prisma.cancellation.create({
                            data: {
                                businessId: businessId,
                                serviceId: service.id,
                                originalStartTime: startTime,
                                originalEndTime: endTime,
                                discountPercent: discountPercent,
                                discountedPrice: discountedPrice,
                                status: "AVAILABLE",
                                minDiscount: minDiscount,
                                maxDiscount: maxDiscount,
                                expiresAt: startTime,
                            },
                        })];
                });
            });
        }
        var ownerSalon, ownerGym, ownerDental, ownerSpa, ownerYoga, salon, gym, dental, spa, yoga, services, now, hour, cancellations, consumer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌱 Seeding Rebookd database...\n");
                    // ── Clean slate ──────────────────────────────────────
                    return [4 /*yield*/, prisma.notification.deleteMany()];
                case 1:
                    // ── Clean slate ──────────────────────────────────────
                    _a.sent();
                    return [4 /*yield*/, prisma.watchlist.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.review.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.booking.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.cancellation.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.service.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.userPreference.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.business.deleteMany()];
                case 8:
                    _a.sent();
                    console.log("  ✓ Cleared existing marketplace data");
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 9:
                    ownerSalon = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 10:
                    ownerGym = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 11:
                    ownerDental = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 12:
                    ownerSpa = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 13:
                    ownerYoga = _a.sent();
                    console.log("  ✓ Created 5 business owner users");
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                ownerId: ownerSalon.id,
                                name: "Glow Studio",
                                slug: "glow-studio",
                                description: "Premium hair and beauty salon in Midtown Manhattan. Specializing in cuts, color, and styling.",
                                category: "SALON",
                                address: "350 5th Ave",
                                city: "New York",
                                state: "NY",
                                zip: "10118",
                                lat: 40.7484,
                                lng: -73.9857,
                                phone: "+12125551001",
                                email: "glow@example.com",
                                avgRating: 4.7,
                                verified: true,
                            },
                        })];
                case 14:
                    salon = _a.sent();
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                ownerId: ownerGym.id,
                                name: "Iron Forge Fitness",
                                slug: "iron-forge-fitness",
                                description: "Hardcore gym with personal training, HIIT classes, and strength programs.",
                                category: "FITNESS",
                                address: "1585 Broadway",
                                city: "New York",
                                state: "NY",
                                zip: "10036",
                                lat: 40.7580,
                                lng: -73.9855,
                                phone: "+12125551002",
                                email: "forge@example.com",
                                avgRating: 4.5,
                                verified: true,
                            },
                        })];
                case 15:
                    gym = _a.sent();
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                ownerId: ownerDental.id,
                                name: "Bright Smile Dental",
                                slug: "bright-smile-dental",
                                description: "Modern dental practice offering cleanings, whitening, and cosmetic dentistry.",
                                category: "DENTAL",
                                address: "11 W 42nd St",
                                city: "New York",
                                state: "NY",
                                zip: "10036",
                                lat: 40.7549,
                                lng: -73.9840,
                                phone: "+12125551003",
                                email: "smile@example.com",
                                avgRating: 4.8,
                                verified: true,
                            },
                        })];
                case 16:
                    dental = _a.sent();
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                ownerId: ownerSpa.id,
                                name: "Zen Retreat Spa",
                                slug: "zen-retreat-spa",
                                description: "Relaxation and therapeutic massage in a tranquil setting near Herald Square.",
                                category: "SPA",
                                address: "1293 Broadway",
                                city: "New York",
                                state: "NY",
                                zip: "10001",
                                lat: 40.7425,
                                lng: -73.9884,
                                phone: "+12125551004",
                                email: "zen@example.com",
                                avgRating: 4.9,
                                verified: true,
                            },
                        })];
                case 17:
                    spa = _a.sent();
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                ownerId: ownerYoga.id,
                                name: "Flow Yoga Studio",
                                slug: "flow-yoga-studio",
                                description: "Vinyasa, hot yoga, and meditation classes for all levels.",
                                category: "YOGA",
                                address: "27 W 24th St",
                                city: "New York",
                                state: "NY",
                                zip: "10010",
                                lat: 40.7437,
                                lng: -73.9910,
                                phone: "+12125551005",
                                email: "flow@example.com",
                                avgRating: 4.6,
                                verified: true,
                            },
                        })];
                case 18:
                    yoga = _a.sent();
                    console.log("  ✓ Created 5 businesses (Salon, Gym, Dental, Spa, Yoga)");
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 19:
                    services = _a.sent();
                    console.log("  \u2713 Created ".concat(services.length, " services across all businesses"));
                    now = new Date();
                    hour = 60 * 60 * 1000;
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 20:
                    cancellations = _a.sent();
                    console.log("  \u2713 Created ".concat(cancellations.length, " cancellation slots with dynamic pricing"));
                    return [4 /*yield*/, prisma.user.upsert({
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
                        })];
                case 21:
                    consumer = _a.sent();
                    // Set consumer preferences
                    return [4 /*yield*/, prisma.userPreference.createMany({
                            data: [
                                { userId: consumer.id, category: "SALON", enabled: true },
                                { userId: consumer.id, category: "YOGA", enabled: true },
                                { userId: consumer.id, category: "SPA", enabled: true },
                                { userId: consumer.id, category: "DENTAL", enabled: false },
                            ],
                        })];
                case 22:
                    // Set consumer preferences
                    _a.sent();
                    // Watchlist some businesses
                    return [4 /*yield*/, prisma.watchlist.createMany({
                            data: [
                                { userId: consumer.id, businessId: salon.id },
                                { userId: consumer.id, businessId: spa.id },
                            ],
                        })];
                case 23:
                    // Watchlist some businesses
                    _a.sent();
                    console.log("  ✓ Created test consumer with preferences and watchlist");
                    // ── Summary ──────────────────────────────────────────
                    console.log("\n🎉 Seed complete!\n");
                    console.log("  Businesses:     5");
                    console.log("  Services:       ".concat(services.length));
                    console.log("  Cancellations:  ".concat(cancellations.length));
                    console.log("  Consumer:       1 (test@consumer.test)");
                    console.log("");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
