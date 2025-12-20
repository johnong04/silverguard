import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const toggleTaken = mutation({
  args: { medId: v.id("medications"), taken: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.medId, { taken: args.taken });
  },
});

export const markAllAsTaken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const med of meds) {
      if (!med.taken) {
        await ctx.db.patch(med._id, { taken: true });
      }
    }
  },
});

