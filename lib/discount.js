"use strict";
/**
 * Dynamic discount calculator for Rebookd.
 *
 * Discount scales with time-to-appointment:
 *   > 24h  → 10%    > 12h → 15%    > 6h  → 20%
 *   > 3h   → 25%    > 1h  → 35%    > 30m → 45%
 *   ≤ 30m  → 50%
 *
 * Business-configurable floor (minDiscount) and ceiling (maxDiscount)
 * are respected as bounds.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscount = calculateDiscount;
exports.calculateDiscountedPrice = calculateDiscountedPrice;
var DISCOUNT_TIERS = [
    { thresholdMs: 24 * 60 * 60 * 1000, discount: 10 }, // > 24h
    { thresholdMs: 12 * 60 * 60 * 1000, discount: 15 }, // > 12h
    { thresholdMs: 6 * 60 * 60 * 1000, discount: 20 }, // > 6h
    { thresholdMs: 3 * 60 * 60 * 1000, discount: 25 }, // > 3h
    { thresholdMs: 1 * 60 * 60 * 1000, discount: 35 }, // > 1h
    { thresholdMs: 30 * 60 * 1000, discount: 45 }, // > 30m
];
var MAX_TIER_DISCOUNT = 50; // ≤ 30 min
function calculateDiscount(originalStartTime, minDiscount, maxDiscount, now) {
    if (minDiscount === void 0) { minDiscount = 10; }
    if (maxDiscount === void 0) { maxDiscount = 50; }
    if (now === void 0) { now = new Date(); }
    var timeUntilStart = originalStartTime.getTime() - now.getTime();
    // If the appointment has already passed, no discount (expired)
    if (timeUntilStart <= 0)
        return 0;
    // Find the matching tier
    var rawDiscount = MAX_TIER_DISCOUNT;
    for (var _i = 0, DISCOUNT_TIERS_1 = DISCOUNT_TIERS; _i < DISCOUNT_TIERS_1.length; _i++) {
        var tier = DISCOUNT_TIERS_1[_i];
        if (timeUntilStart > tier.thresholdMs) {
            rawDiscount = tier.discount;
            break;
        }
    }
    // Clamp to business bounds
    return Math.max(minDiscount, Math.min(maxDiscount, rawDiscount));
}
function calculateDiscountedPrice(originalPrice, discountPercent) {
    return Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
}
