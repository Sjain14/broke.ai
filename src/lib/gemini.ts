import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
);

export async function generateToxicRoast(
  amount: number,
  item: string,
  remainingBudget: number,
  daysLeft: number,
  totalBudget: number
): Promise<string> {
  const percentageLeft = ((remainingBudget / totalBudget) * 100).toFixed(1);
  const prompt = `You are BROKE.AI, the user's brutally honest best friend.
Reality Check: They have ₹${remainingBudget} left out of their ₹${totalBudget} discretionary budget (${percentageLeft}% remaining) with ${daysLeft} days left until payday.
They just spent ₹${amount} on ${item}.
Instruction: You MUST use the math provided in the Reality Check against them (e.g., "You only have 30% of your money left for the next 21 days and you bought THIS?"). Roast them in under 150 characters. Tell them they are ruining their future. Be funny but brutal.
Return ONLY a raw JSON object with no markdown formatting: { "item": "string", "amount": number, "roast": "string" }`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as ReceiptAnalysis;
    return parsed.roast || "You broke the AI along with your bank account.";
  } catch {
    return "Even my servers can't handle how broke you are. Connection failed — just like your financial planning.";
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are BROKE.AI, the user's brutally honest best friend. Analyze this receipt. Extract the main item bought and the total amount.
Reality Check: They have ₹${remainingBudget} left out of their ₹${totalBudget} discretionary budget (${percentageLeft}% remaining) with ${daysLeft} days left until payday.
Instruction: You MUST use the math provided in the Reality Check against them (e.g., "You only have 30% of your money left for the next 21 days and you bought THIS?"). Write a brutal 150-character roast about this purchase.
Return ONLY a raw JSON object with no markdown formatting: { "item": "string", "amount": number, "roast": "string" }`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    prompt,
  ]);

  const raw = result.response.text().trim();

  // Strip any accidental markdown code fences if model ignores instructions
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as ReceiptAnalysis;
    if (!parsed.item || typeof parsed.amount !== 'number' || !parsed.roast) {
      throw new Error('Invalid structure');
    }
    return parsed;
  } catch {
    return {
      item: 'unknown purchase',
      amount: 0,
      roast: "Your receipt is as unreadable as your financial decisions. Truly impressive chaos.",
    };
  }
}
