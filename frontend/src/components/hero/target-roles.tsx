import { Badge } from '@/components/ui/badge'
import { TARGET_ROLES } from '@/lib/constants'

export function TargetRoles() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {TARGET_ROLES.map((role) => (
        <Badge
          key={role}
          variant="secondary"
          className="rounded-full px-3 py-1 text-xs font-medium"
        >
          {role}
        </Badge>
      ))}
    </div>
  )
}
