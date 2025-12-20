import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    guardianId: v.string(),
    status: v.union(
      v.literal("safe"),
      v.literal("away"),
      v.literal("fall_detected")
    ),
    lastSeen: v.number(),
  }).index("by_guardian", ["guardianId"]),

  events: defineTable({
    type: v.union(
      v.literal("fall"),
      v.literal("meds"),
      v.literal("welfare")
    ),
    timestamp: v.number(),
    userId: v.id("users"),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  medications: defineTable({
    name: v.string(),
    time: v.string(),
    taken: v.boolean(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
});


