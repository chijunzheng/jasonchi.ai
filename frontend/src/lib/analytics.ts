import { track } from '@vercel/analytics'

export type AnalyticsEvent =
  | 'chat_started'
  | 'message_sent'
  | 'category_selected'
  | 'jd_analyzed'
  | 'cover_letter_generated'
  | 'resume_downloaded'
  | 'session_summary_copied'
  | 'lead_submitted'
  | 'starter_prompt_clicked'
  | 'follow_up_clicked'

export function trackEvent(
  name: AnalyticsEvent,
  properties?: Record<string, string>,
) {
  try {
    track(name, properties)
  } catch {
    // Silently fail — analytics should never break the app
  }
}
