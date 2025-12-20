import { mutation, query } from "./_generated/server"; // Added query here
import { v } from "convex/values";

export const logFall = mutation({
  args: { userId: v.id("users"), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("events", {
      type: "fall",
      timestamp,
      userId: args.userId,
      metadata: args.metadata,
    });

    // Also update user status immediately
    await ctx.db.patch(args.userId, {
      status: "fall_detected",
      lastSeen: timestamp,
    });
  },
});

export const triggerWelfareCheck = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      type: "welfare",
      timestamp: Date.now(),
      userId: args.userId,
    });
  },
});

export const logResolution = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      type: "resolved",
      timestamp: Date.now(),
      userId: args.userId,
    });

    // Also reset user status to safe
    await ctx.db.patch(args.userId, {
      status: "safe",
      lastSeen: Date.now(),
    });
  },
});

export const getRecent = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 5);
  },
});
