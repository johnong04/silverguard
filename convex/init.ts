import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) return;

    const userId = await ctx.db.insert("users", {
      name: "Auntie Rose",
      guardianId: "demo-guardian-id",
      status: "safe",
      lastSeen: Date.now(),
    });

    await ctx.db.insert("medications", {
      name: "Aspirin",
      time: "09:00 AM",
      taken: false,
      userId,
    });

    await ctx.db.insert("medications", {
      name: "Vitamin C",
      time: "09:00 AM",
      taken: true,
      userId,
    });

    await ctx.db.insert("events", {
      type: "welfare",
      timestamp: Date.now(),
      userId,
      metadata: { note: "Initial system check" },
    });

    console.log("Database seeded with demo data.");
  },
});
