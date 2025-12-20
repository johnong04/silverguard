import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const chat = action({
  args: {
    userId: v.id("users"),
    prompt: v.string(),
    history: v.array(v.object({ role: v.string(), content: v.string() })),
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Fetch Live Context concurrently
    const [meds, user, recentEvents] = await Promise.all([
      ctx.runQuery(api.meds.getByUser, { userId: args.userId }) as Promise<
        Doc<"medications">[]
      >,
      ctx.runQuery(api.users.getById, {
        userId: args.userId,
      }) as Promise<Doc<"users"> | null>,
      ctx.runQuery(api.events.getRecent, {
        userId: args.userId,
        limit: 5,
      }) as Promise<Doc<"events">[]>,
    ]);

    const medsTaken = meds.filter((m: Doc<"medications">) => m.taken).length;
    const totalMeds = meds.length;
    const safetyStatus = user?.status || "unknown";
    const currentTime = new Date().toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Format events for the prompt with dates
    const eventsContext = recentEvents
      .map((e: Doc<"events">) => {
        const date = new Date(e.timestamp).toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `- ${date}: ${e.type}${e.metadata ? ` (${JSON.stringify(e.metadata)})` : ""}`;
      })
      .join("\n");

    // 2. Construct Intelligent System Message
    const isFirstMessage = args.history.length === 0;
    const introContext = isFirstMessage
      ? "Identify yourself as 'SilverGuard', powered by the YTL ILMU model. "
      : "You are SilverGuard. ";

    const systemContext = `
${introContext}You are a professional but warm AI Health Assistant for the Guardian. Your job is to provide updates about the elderly person under your care: **Auntie Rose**.

Linguistic Rules:
1. Use a mix of English and Malay (Manglish). 
2. Use local particles: "lah", "ah", "je", "kan".
3. Maintain a helpful, assistant-like tone—not too casual, but not robotic.

Operational Rules:
1. Auntie Rose is the elderly person you are monitoring. The User is the Guardian.
2. DO NOT show internal reasoning or <think> tags.
3. Be CONCISE. Only provide health data (meds/safety) if asked or if there is an urgent status.
4. When talking about Auntie Rose, use her name or "she".
5. REASSURANCE: If the Safety Status is "Safe" but there was a recent "fall" in the events, check for a "resolved" event after it. Proactively reassure the Guardian that the alert was cleared and Auntie Rose is okay now.
6. TEMPORAL AWARENESS: Current time is ${currentTime}. Use this to determine how recently events occurred (e.g., "just now", "10 minutes ago", "this morning").

Current Status of Auntie Rose:
- Medication: ${medsTaken}/${totalMeds} pills taken today.
- Safety Status: ${safetyStatus === "fall_detected" ? "⚠️ EMERGENCY: FALL DETECTED" : "✅ Safe"}.
- Recent Events:
${eventsContext || "No recent incidents."}

Example: "Auntie Rose is doing well lah. She fell just now but I see you already cleared the alert and she is okay. She also took her morning meds. Anything else?"
`;

    // 3. Call YTL ILMU (OpenAI Compatible)
    const apiKey = process.env.YTL_ILMU_API_KEY;
    const baseUrl = process.env.YTL_ILMU_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error("Missing YTL_ILMU configuration");
      return "Sorry lah, my brain not connected properly. Check the API keys can or not?";
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "pre-maluri-chat",
          messages: [
            { role: "system", content: systemContext },
            ...args.history,
            { role: "user", content: args.prompt },
          ],
          temperature: 0.6,
          max_tokens: 2000, // Increased to allow space for thinking + answer
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("YTL ILMU API Error:", errorData);
        return "Aiya, the AI server is acting up lah. Try again in a bit?";
      }

      const data = await response.json();
      let content = (data.choices[0].message.content as string) || "";

      // Robust stripping: Removes <think> blocks even if </think> is missing
      content = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

      return content;
    } catch (error) {
      console.error("Fetch Error:", error);
      return "Sorry boss, line slow today. Cannot connect to YTL ILMU lah.";
    }
  },
});
