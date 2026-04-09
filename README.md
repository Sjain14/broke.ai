<div align="center">
  <h1>💸 Broke.AI 💸</h1>
  <h3>Your Toxic Financial Manager</h3>
  <p><i>Because pie charts don't change behavior. Psychological abuse does.</i></p>

  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Zustand](https://img.shields.io/badge/Zustand-Bear-orange?style=for-the-badge)
  ![Gemini 3.0](https://img.shields.io/badge/Gemini-3.0_Flash-blue?style=for-the-badge&logo=google)
</div>

---

## 💥 The Problem & The Solution

Traditional budgeting apps are fundamentally broken. They give you a neat little pie chart that tells you you've spent 40% of your money on food. You look at it, feel a fleeting moment of guilt, and then immediately order another ₹800 pizza on Zomato. **Pie charts do not change human behavior.**

**Broke.AI** does. We believe that humans respond best to two things: panic and psychological abuse. We built an AI auditor that tracks your spending, actively calculates how close you are to starvation, and brutally roasts your financial decisions in real-time. It’s tough love, heavy on the tough. 

## ☠️ Core Features

*   **🧠 Dynamic Persona Engine:** The AI doesn't just blindly insult you; it adapts to your exact financial reality. If you are entirely broke and buy a ₹10 snack, it destroys you for prioritizing sugar over survival. If you are rich and buy that same snack, it acts dismissive and body-shames the chocolate. 
*   **⚖️ Dual Telegram-Style Modes:** Use `💸 /confess` to declare a purchase and get audited. Use `🆘 /help` when you actually need tough-love financial direction without logging an expense.
*   **📸 Receipt Vision Parsing:** Don't want to type? Upload a picture of your physical receipt. The Gemini 3.0 Vision model will automatically extract the core damage and roast you for it instantly.
*   **🚨 Panic UI:** State-driven Framer Motion and CSS red-alerts trigger literal physical stress when your budget drops into the danger zone. 

---

## 🧠 Context-Aware Persona: The "Mood" Shift
Below is a demonstration of how the AI's intelligence changes based on your bank balance. Even with the same prompt, the response evolves from "Sassy Approval" to "Total Destruction."

| 🟢 Phase 1: High Budget Tolerance | 🔴 Phase 2: The Impulse Trap |
| :--- | :--- |
| **Prompt:** "Can I eat outside?" <br> **Status:** ₹27,100 left. <br> **AI:** Sassy, mathematically allowing, but warns about your future. | **Action:** Spent ₹20,199 on a Zara dress. <br> **Ledger Name:** *Zara dress* (Auto-generated). <br> **AI:** Nuclear meltdown mode triggered. |
| <img src="https://github.com/user-attachments/assets/e50348e6-4f29-4e5d-942a-1ba05b1b552b" width="100%" /> | <img src="https://github.com/user-attachments/assets/be65d80e-263f-4534-90da-165dc3903fc4" width="100%" /> |
| **Phase 3: Low Budget Reality** | **Phase 4: Sarcastic Discipline** |
| **Prompt:** (Same as Phase 1) "Can I eat outside?" <br> **Status:** ₹6,901 left. <br> **AI:** Absolute denial. Commands you to stay home. | **Action:** Saved money on dinner (Spent ₹260). <br> **Ledger Name:** *Dynamite Friends* (Auto-generated). <br> **AI:** Roasts you for "begging for ₹10" despite the save. |
| <img src="https://github.com/user-attachments/assets/dad0c83d-dd10-4428-9ee4-51b21101502a" width="100%" /> | <img src="https://github.com/user-attachments/assets/4b269f06-2e80-4726-a97a-e70945c6405d" width="100%" /> |

---

## 📊 Visual Stress Indicators (Header Evolution)
The UI doesn't just show numbers; it changes its visual "blood pressure" as you near bankruptcy.

| **Healthy (Relieved)** | **Warning (Nervous)** | **Bankrupt (Dead)** | **Deficit (On Fire)** |
| :---: | :---: | :---: | :---: |
| <img width="1919" height="934" alt="image" src="https://github.com/user-attachments/assets/4b269f06-2e80-4726-a97a-e70945c6405d" /> | <img width="475" height="233" alt="image" src="https://github.com/user-attachments/assets/39bd4d82-6b60-438e-bfcd-e22a3dce477e" /> | <img width="479" height="231" alt="image" src="https://github.com/user-attachments/assets/b1d2edf6-29e8-4e18-9ef0-ccad77cb368c" /> | <img width="470" height="222" alt="image" src="https://github.com/user-attachments/assets/918ef413-7673-44f0-b7d6-699be7cf7405" /> |
| **"You're okay... for now."** | **"The sweat is real."** | **"Game over, man."** | **"Burning your savings."** |

---


## 🔮 The Future: Our Diabolical Roadmap

What we built for this hackathon is just the MVP. Here is where the platform goes next to entirely enforce financial discipline:

*   **📧 Automated Email Interception:** Integrate with Google Workspace APIs to auto-read Zomato, Swiggy, and Amazon receipts. The second the email hits your inbox, Broke.AI sends you a WhatsApp push notification roasting you while the delivery guy is still on his way.
*   **🛑 OTP / SMS Gateway Hijacking:** By wrapping around Twilio or native Mobile APIs, Broke.AI intercepts bank OTPs. When you try to make an impulsive purchase online, it halts the transaction: *"Are you seriously trying to spend ₹5000 on shoes right now? You only have ₹2000 left for the next 15 days. Type 'I HAVE NO SELF CONTROL' to receive your OTP."*
*   **📉 Automated SIP Shaming:** If the system detects you skipped your monthly investments via automated bank syncs, it locks you out of your discretionary allowance tracker entirely until you invest.

---

## 🚀 Local Setup

Want to get abused locally? It takes less than 60 seconds.

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Set up your environment variables
# Create a .env.local file in the root directory and add:
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# 3. Spin up the interrogation room
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and prepare to have your ego dismantled.

---
<div align="center">
  <i>Built for the hackathon with ❤️ (and impending debt)</i>
</div>
