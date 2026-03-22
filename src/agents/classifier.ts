import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ClassificationResult {
  category: string
  urgency: string
  reply: string
}

const CATEGORIES = ['Bug', 'Feature Request', 'Complaint', 'Billing', 'General']
const URGENCY_LEVELS = ['Critical', 'High', 'Medium', 'Low']

const KEYWORD_MAP: Record<string, { pattern: RegExp; category: string; urgency: string }[]> = {
  Bug: [
    { pattern: /crash/i, category: 'Bug', urgency: 'High' },
    { pattern: /error/i, category: 'Bug', urgency: 'High' },
    { pattern: /bug/i, category: 'Bug', urgency: 'Medium' },
    { pattern: /broken/i, category: 'Bug', urgency: 'High' },
    { pattern: /fail/i, category: 'Bug', urgency: 'High' },
    { pattern: /not\s*work/i, category: 'Bug', urgency: 'High' },
    { pattern: /fix/i, category: 'Bug', urgency: 'Medium' },
  ],
  Billing: [
    { pattern: /refund/i, category: 'Billing', urgency: 'Medium' },
    { pattern: /charge/i, category: 'Billing', urgency: 'Medium' },
    { pattern: /billing/i, category: 'Billing', urgency: 'Medium' },
    { pattern: /payment/i, category: 'Billing', urgency: 'Medium' },
    { pattern: /invoice/i, category: 'Billing', urgency: 'Low' },
    { pattern: /subscri/i, category: 'Billing', urgency: 'Medium' },
  ],
  Complaint: [
    { pattern: /terrible/i, category: 'Complaint', urgency: 'High' },
    { pattern: /awful/i, category: 'Complaint', urgency: 'High' },
    { pattern: /worst/i, category: 'Complaint', urgency: 'High' },
    { pattern: /unacceptable/i, category: 'Complaint', urgency: 'High' },
    { pattern: /complain/i, category: 'Complaint', urgency: 'Medium' },
    { pattern: /frustrat/i, category: 'Complaint', urgency: 'Medium' },
    { pattern: /angry/i, category: 'Complaint', urgency: 'High' },
  ],
  'Feature Request': [
    { pattern: /feature/i, category: 'Feature Request', urgency: 'Low' },
    { pattern: /request/i, category: 'Feature Request', urgency: 'Low' },
    { pattern: /suggest/i, category: 'Feature Request', urgency: 'Low' },
    { pattern: /add\s/i, category: 'Feature Request', urgency: 'Low' },
    { pattern: /would\s*be\s*nice/i, category: 'Feature Request', urgency: 'Low' },
    { pattern: /can\s*you\s*add/i, category: 'Feature Request', urgency: 'Low' },
  ],
}

const CANNED_REPLIES: Record<string, string> = {
  Bug: 'Thanks for reporting this bug. Our dev team has been notified and will investigate shortly.',
  Billing: 'We\'ve received your billing inquiry. Our billing team will review and get back to you soon.',
  Complaint: 'We\'re sorry to hear about your experience. A support lead has been assigned to look into this.',
  'Feature Request': 'Great suggestion! We\'ve logged this as a feature request for the product team to review.',
  General: 'Thanks for reaching out. A support agent will follow up with you shortly.',
}

function classifyWithKeywords(message: string): ClassificationResult {
  for (const [, patterns] of Object.entries(KEYWORD_MAP)) {
    for (const { pattern, category, urgency } of patterns) {
      if (pattern.test(message)) {
        return { category, urgency, reply: CANNED_REPLIES[category] }
      }
    }
  }
  return { category: 'General', urgency: 'Low', reply: CANNED_REPLIES.General }
}

export async function classify(message: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return classifyWithKeywords(message)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a support ticket classifier. Classify this customer message and provide a helpful reply.

Message: "${message}"

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "category": one of [${CATEGORIES.map(c => `"${c}"`).join(', ')}],
  "urgency": one of [${URGENCY_LEVELS.map(u => `"${u}"`).join(', ')}],
  "reply": "a helpful, professional reply to the customer (1-2 sentences)"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as ClassificationResult

    if (!CATEGORIES.includes(parsed.category)) parsed.category = 'General'
    if (!URGENCY_LEVELS.includes(parsed.urgency)) parsed.urgency = 'Low'
    if (!parsed.reply) parsed.reply = CANNED_REPLIES[parsed.category]

    return parsed
  } catch (err) {
    console.error('[classifier] Gemini failed, using keyword fallback:', (err as Error).message)
    return classifyWithKeywords(message)
  }
}
