import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
);

export async function generateToxicRoast(
  amount: number,
  item: string,
  remainingBudget: number
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a toxic financial advisor. The client only has ₹${remainingBudget} left for the month. They just spent ₹${amount} on ${item}. Roast them in under 150 characters. Tell them they are ruining their future. Be funny but brutal.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
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
  remainingBudget: number
): Promise<ReceiptAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a toxic financial advisor. Analyze this receipt. Extract the main item bought and the total amount. Also write a brutal 150-character roast about this purchase knowing they only have ₹${remainingBudget} left. Return ONLY a raw JSON object with no markdown formatting: { "item": "string", "amount": number, "roast": "string" }`;

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
