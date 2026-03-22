// Auto-resolution agent: matches messages against a knowledge base of common issues
// If a high-confidence match is found, resolves the ticket automatically

interface KBEntry {
  patterns: RegExp[]
  category: string
  resolution: string
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    patterns: [/reset.*password/i, /forgot.*password/i, /can'?t.*log\s*in/i, /login.*issue/i, /password.*reset/i],
    category: 'General',
    resolution: 'To reset your password: Go to Settings > Account > Reset Password. A reset link will be sent to your registered email. If you don\'t receive it within 5 minutes, check your spam folder.',
  },
  {
    patterns: [/cancel.*subscription/i, /unsubscribe/i, /stop.*billing/i, /cancel.*plan/i],
    category: 'Billing',
    resolution: 'To cancel your subscription: Go to Settings > Billing > Manage Plan > Cancel. Your access continues until the end of your current billing period. No further charges will be made.',
  },
  {
    patterns: [/notification.*setting/i, /stop.*notification/i, /too.*many.*notification/i, /turn.*off.*alert/i, /disable.*notification/i],
    category: 'General',
    resolution: 'To manage notifications: Go to Settings > Notifications. You can toggle individual notification types on/off, set quiet hours, or adjust delivery preferences.',
  },
  {
    patterns: [/delete.*account/i, /remove.*account/i, /close.*account/i],
    category: 'General',
    resolution: 'To delete your account: Go to Settings > Account > Delete Account. Please note this action is irreversible. Your data will be permanently removed within 30 days. For assistance, our support team can guide you through the process.',
  },
  {
    patterns: [/refund/i, /money.*back/i, /charged.*twice/i, /double.*charge/i, /overcharged/i],
    category: 'Billing',
    resolution: 'We\'ve flagged your billing concern for immediate review. Our billing team will investigate and process any necessary refund within 3-5 business days. You\'ll receive a confirmation email once resolved.',
  },
  {
    patterns: [/app.*crash/i, /keeps.*crashing/i, /force.*close/i, /app.*freeze/i],
    category: 'Bug',
    resolution: 'For app crashes, try these steps: 1) Force close and reopen the app. 2) Clear the app cache in Settings > Apps > Clear Cache. 3) Ensure you\'re on the latest version. If the issue persists, our dev team has been notified and is investigating.',
  },
  {
    patterns: [/slow/i, /loading.*forever/i, /takes.*long/i, /performance/i, /laggy/i],
    category: 'Bug',
    resolution: 'We\'re aware of performance concerns. Try: 1) Check your internet connection. 2) Clear the app cache. 3) Restart the app. Our team is continuously optimizing performance. If the issue persists, we\'ve logged this for investigation.',
  },
  {
    patterns: [/update.*plan/i, /upgrade/i, /change.*plan/i, /switch.*tier/i],
    category: 'Billing',
    resolution: 'To change your plan: Go to Settings > Billing > Manage Plan. Select your preferred tier and confirm. Changes take effect at the start of your next billing cycle. For enterprise plans, our sales team will reach out.',
  },
]

export function tryAutoResolve(message: string, category: string): string | null {
  for (const entry of KNOWLEDGE_BASE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(message)) {
        return `[Auto-Resolved] ${entry.resolution}`
      }
    }
  }
  return null
}

export function getKBSize(): number {
  return KNOWLEDGE_BASE.length
}
