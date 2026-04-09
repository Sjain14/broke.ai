import { GoogleGenerativeAI } from '@google/generative-ai';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) { console.error("🚨 CRITICAL: NEXT_PUBLIC_GEMINI_API_KEY is undefined! Check your .env.local file and restart the server."); }

const genAI = new GoogleGenerativeAI(
  apiKey || ""
);

export async function generateToxicRoast(
  amount: number,
  item: string,
  remainingBudget: number,
  daysLeft: number,
  totalBudget: number,
  type: 'expense' | 'help'
): Promise<{ roast: string; summarizedItem: string }> {
  const pctLeft = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0;
  const daily = daysLeft > 0 ? remainingBudget / daysLeft : remainingBudget;
  const costPct = remainingBudget > 0 && amount > 0 ? (amount / remainingBudget) * 100 : 0;

  let moodRules = "";
  if (type === 'help') {
    moodRules = "Persona: Tough Love Financial Advisor. The user is asking for advice. Don't just insult them—actually answer their question or give financial direction, but wrap it in heavy sarcasm, passive-aggressiveness, and witty roasts.";
  } else {
    // type === 'expense'
    if (amount <= 50 && pctLeft > 50) {
      moodRules = "Persona: Sassy but Allowing. This is a tiny micro-expense (like a ₹10 chocolate) and they have plenty of money. Allow them to have this small happiness, but roast the item itself (e.g., 'Fine, buy the chocolate. Your wallet won't feel it, but your waistline will.'). Do NOT act like they are going bankrupt.";
    } else if (amount <= 50 && pctLeft < 15) {
      moodRules = "Persona: Utter Disbelief. It's a tiny expense, but they are completely broke. Roast them for prioritizing junk over survival. 'You have ₹500 left and you're buying a ₹10 snack? Priorities.'";
    } else if (costPct > 20) {
      moodRules = "Persona: Nuclear Meltdown. This single purchase is over 20% of their remaining net worth. Rip their financial decision-making to shreds.";
    } else {
      moodRules = "Persona: Brutal, witty auditor. Roast this purchase based on their remaining daily allowance.";
    }
  }

  const prompt = `You are BROKE.AI, a sassy, hyper-intelligent financial manager.
CURRENT REALITY: ₹${remainingBudget} left (${pctLeft.toFixed(1)}% of budget). ${daysLeft} days to payday. Daily allowance: ₹${daily.toFixed(0)}.
BEHAVIORAL DIRECTIVE: ${moodRules}
USER INPUT: ${item} (Amount: ₹${amount})
OUTPUT FORMAT: You must summarize the user's rambling input into a short, punchy 2-3 word title. IMPORTANT: The "item" field in the JSON must be DIRECT, LITERAL, and DESCRIPTIVE. Do NOT use sarcasm or metaphors here. If the user bought Zara clothes, the item is "Zara Shopping". If they had dinner, it is "Dinner Out". Save all sarcasm for the "roast" field only. Return ONLY a raw JSON object: { "item": "Literal Summary", "roast": "Your dynamic response" }`;

  if (DEBUG) console.log('Sending to Gemini:', { prompt });
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    if (DEBUG) console.log('Raw Gemini Response:', raw);

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const parsed = JSON.parse(jsonMatch[0]);
      return { roast: parsed.roast || "You broke the AI along with your bank account.", summarizedItem: parsed.item || item };
    } catch (error: any) {
      if (DEBUG) console.error('Gemini Parse Error:', error, 'Raw Text:', raw);
      if (error?.message?.includes("403")) return { roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env.", summarizedItem: item };
      // If parsing fails, just return the cleaned up raw text as the roast so the UI doesn't break.
      return { roast: raw.replace(/[\{\}\\"]/g, '').replace(/json/gi, '').trim() || "My circuits fried trying to calculate your poverty.", summarizedItem: item.length > 20 ? "Financial Mistake" : item };
    }
  } catch (error: any) {
    if (DEBUG) console.error('Gemini Network Error:', error);
    if (error?.message?.includes("403")) return { roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env.", summarizedItem: item };
    return { roast: "Even my servers can't handle how broke you are. Connection failed — just like your financial planning.", summarizedItem: item };
  }
}

export interface ReceiptAnalysis {
  item: string;
  amount: number;
  roast: string;
}

export async function analyzeReceipt(
  base64Image: string,
  mimeType: string,
  remainingBudget: number,
  daysLeft: number,
  totalBudget: number
): Promise<ReceiptAnalysis> {
  const percentageLeft = ((remainingBudget / totalBudget) * 100).toFixed(1);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `You are BROKE.AI, the user's brutally honest best friend. Analyze this receipt. Extract the main item bought and the total amount.
Reality Check: They have ₹${remainingBudget} left out of their ₹${totalBudget} discretionary budget (${percentageLeft}% remaining) with ${daysLeft} days left until payday.
Instruction: You MUST use the math provided in the Reality Check against them. Write a brutal 150-character roast about this purchase.
Return ONLY a raw JSON object with no markdown formatting: { "item": "string", "amount": number, "roast": "string" }`;

  if (DEBUG) console.log('Sending to Gemini Vision:', { mimeType, prompt });

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Image } },
      prompt,
    ]);

    const raw = result.response.text().trim();
    if (DEBUG) console.log('Raw Gemini Response:', raw);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]) as ReceiptAnalysis;
    
    if (!parsed.item || typeof parsed.amount !== 'number' || !parsed.roast) {
      throw new Error('Invalid structure');
    }
    return parsed;
  } catch (error: any) {
    if (DEBUG) console.error('Gemini Vision Parse Error:', error);
    if (error?.message?.includes("403")) return { item: 'error', amount: 0, roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env." };
    return {
      item: 'unknown purchase',
      amount: 0,
      roast: "Your receipt is as unreadable as your financial decisions. Truly impressive chaos.",
    };
  }
}
