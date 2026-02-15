import { Badge } from '@/components/ui/badge'
import type { ContentCategory } from '@/types/content'

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  'work-experience': 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  'honest-section': 'Honest Section',
  meta: 'About This Site',
}

interface ConfidenceIndicatorProps {
  readonly category?: ContentCategory
}

export function ConfidenceIndicator({ category }: ConfidenceIndicatorProps) {
  if (!category) return null

  return (
    <div className="flex items-center gap-1.5 pl-2 text-xs text-muted-foreground">
      <span>Based on:</span>
      <Badge variant="outline" className="text-xs px-1.5 py-0">
        {CATEGORY_LABELS[category]}
      </Badge>
    </div>
  )
}
