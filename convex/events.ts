import { mutation } from "./_generated/server";
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


