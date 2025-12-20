import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByGuardian = query({
  args: { guardianId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_guardian", (q) => q.eq("guardianId", args.guardianId))
      .unique();
  },
});

export const updateStatus = mutation({
  args: { userId: v.id("users"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      status: args.status as any,
      lastSeen: Date.now(),
    });
  },
});

