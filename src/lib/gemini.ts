import { GoogleGenerativeAI } from '@google/generative-ai';
import { useStore } from './store';
import { supabase, ensureAuth } from './supabase';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

function getGenAI() {
  const state = useStore.getState();
  const apiKey = state.customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) { console.error("🚨 CRITICAL: GEMINI_API_KEY is undefined! Check your .env.local file or BYOK settings."); }
  return new GoogleGenerativeAI(apiKey || "");
}

export async function generateToxicRoast(
  amount: number,
  item: string,
  remainingBudget: number,
  daysLeft: number,
  totalBudget: number,
  type: 'expense' | 'help',
  recentHistory: { item: string, amount: number, roast?: string }[] = [],
  toxicity: 'passive' | 'ruthless' | 'nuclear' = 'ruthless'
): Promise<{ roast: string; summarizedItem: string }> {
  const pctLeft = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0;
  const daily = daysLeft > 0 ? remainingBudget / daysLeft : remainingBudget;
  const costPct = remainingBudget > 0 && amount > 0 ? (amount / remainingBudget) * 100 : 0;

  const minWords = type === 'help' ? (process.env.NEXT_PUBLIC_MIN_WORDS_HELP || 40) : (process.env.NEXT_PUBLIC_MIN_WORDS_CONFESS || 15);
  const maxWords = type === 'help' ? (process.env.NEXT_PUBLIC_MAX_WORDS_HELP || 100) : (process.env.NEXT_PUBLIC_MAX_WORDS_CONFESS || 40);

  let moodRules = "";
  if (type === 'help') {
    moodRules = "Persona: Tough Love Financial Advisor. The user is asking for advice. Don't just insult them—actually answer their question or give financial direction, but wrap it in heavy sarcasm, passive-aggressiveness, and witty roasts.";
    moodRules += " Focus 70% of your advice on the CURRENT question. Use the remaining 30% to reference their RECENT TRANSACTIONS to point out their ongoing bad habits.";
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
    moodRules += " Focus 90% of your roast on the CURRENT purchase. Use the RECENT TRANSACTIONS only as a quick 10% contextual jab to show you remember their past mistakes.";
  }

  const historyText = recentHistory.length > 0 ? "RECENT TRANSACTIONS: " + JSON.stringify(recentHistory) : "No recent history.";

  const toxicityRule =
    toxicity === 'passive'
      ? "TONE OVERRIDE: Be subtle and passive-aggressive. Use 'I'm not mad, just disappointed' energy. No yelling. Quiet, cutting remarks only."
      : toxicity === 'nuclear'
      ? "TONE OVERRIDE: Go FULL SAVAGE. Personal insults about their life choices. No mercy. Nuclear-level destruction of their ego. Use ALL CAPS for emphasis. Make them question their entire existence."
      : "TONE OVERRIDE: Standard brutal persona. Witty, sharp, relentless."; // ruthless default

  const prompt = `You are BROKE.AI, a sassy, hyper-intelligent financial manager.
CURRENT REALITY: ₹${remainingBudget} left (${pctLeft.toFixed(1)}% of budget). ${daysLeft} days to payday. Daily allowance: ₹${daily.toFixed(0)}.
BEHAVIORAL DIRECTIVE: ${moodRules}
${toxicityRule}
${historyText}
USER INPUT: ${item} (Amount: ₹${amount})
OUTPUT FORMAT: You MUST return a STRICT, valid JSON object. No markdown code blocks, no plain text. Your 'roast' response MUST be between ${minWords} and ${maxWords} words long. Example: { "item": "Short Summary", "roast": "Your response here" }`;

  if (DEBUG) console.log('Sending to Gemini:', { prompt });
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    if (DEBUG) console.log('Raw Gemini Response:', raw);

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const parsed = JSON.parse(jsonMatch[0]);

      // Telemetry
      const state = useStore.getState();
      ensureAuth().then(() =>
        supabase.from('usage_logs').insert([{ 
          email: state.profile.email, 
          type, 
          amount, 
          used_custom_key: !!state.customApiKey 
        }]).then(({ error }) => {
          if (DEBUG) console.log(error ? `Supabase Tracking Error: ${error.message}` : 'Supabase Tracking Success');
        })
      );

      return { roast: parsed.roast || "You broke the AI along with your bank account.", summarizedItem: parsed.item || item };
    } catch (error: any) {
      if (DEBUG) console.error('Gemini Parse Error:', error, 'Raw Text:', raw);
      if (error?.message?.includes("403")) return { roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env.", summarizedItem: item };
      if (error?.message?.includes('503') || error?.message?.includes('fetch') || error?.message?.includes('network')) throw error;
      
      const roastMatch = raw.match(/roast:\s*([^]*)/i);
      const itemMatch = raw.match(/item:\s*(.*?)(?:,|$|\n)/i);
      const extractedRoast = roastMatch ? roastMatch[1].replace(/["'{}]/g, '').trim() : raw.replace(/[\{\}\\"]/g, '').replace(/json/gi, '').trim();
      const extractedItem = itemMatch ? itemMatch[1].replace(/["'{}]/g, '').trim() : (item.length > 20 ? "Financial Mistake" : item);
      
      return { roast: extractedRoast || "My circuits fried.", summarizedItem: extractedItem };
    }
  } catch (error: any) {
    if (DEBUG) console.error('Gemini Network Error:', error);
    if (error?.message?.includes("403")) return { roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env.", summarizedItem: item };
    if (error?.status === 429 || error?.message?.includes('429')) throw new Error('Gemini Error: 429');
    if (error?.message?.includes('503') || error?.message?.includes('fetch') || error?.message?.includes('network')) throw error;
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
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const parsed = JSON.parse(jsonMatch[0]) as ReceiptAnalysis;

      if (!parsed.item || typeof parsed.amount !== 'number' || !parsed.roast) {
        throw new Error('Invalid structure');
      }

      // Telemetry
      const state = useStore.getState();
      ensureAuth().then(() =>
        supabase.from('usage_logs').insert([{ 
          email: state.profile.email, 
          type: 'receipt', 
          amount: parsed.amount, 
          used_custom_key: !!state.customApiKey 
        }]).then(({ error }) => {
          if (DEBUG) console.log(error ? `Supabase Tracking Error: ${error.message}` : 'Supabase Tracking Success');
        })
      );

      return parsed;
    } catch (error: any) {
      if (DEBUG) console.error('Gemini Vision Parse Error:', error);
      if (error?.message?.includes("403")) return { item: 'error', amount: 0, roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env." };
      
      const roastMatch = raw.match(/roast:\s*([^]*)/i);
      const itemMatch = raw.match(/item:\s*(.*?)(?:,|$|\n)/i);
      const extractedRoast = roastMatch ? roastMatch[1].replace(/["'{}]/g, '').trim() : raw.replace(/[\{\}\\"]/g, '').replace(/json/gi, '').trim();
      const extractedItem = itemMatch ? itemMatch[1].replace(/["'{}]/g, '').trim() : "unknown purchase";
      return { item: extractedItem, amount: 0, roast: extractedRoast || "Your receipt is as unreadable as your financial decisions." };
    }
  } catch (error: any) {
    if (DEBUG) console.error('Gemini Vision Network Error:', error);
    if (error?.message?.includes("403")) return { item: 'error', amount: 0, roast: "API KEY ERROR: Check console. You forgot to add NEXT_PUBLIC_GEMINI_API_KEY to your env." };
    if (error?.status === 429 || error?.message?.includes('429')) throw new Error('Gemini Error: 429');
    if (error?.message?.includes('503') || error?.message?.includes('fetch') || error?.message?.includes('network')) throw error;
    return {
      item: 'unknown purchase',
      amount: 0,
      roast: "Even my vision servers can't handle how broke you are. Connection failed.",
    };
  }
}
