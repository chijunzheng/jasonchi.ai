import { Badge } from '@/components/ui/badge'
import { TARGET_ROLES } from '@/lib/constants'

export function TargetRoles() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {TARGET_ROLES.map((role) => (
        <Badge
          key={role}
          variant="secondary"
          className="hero-subsurface rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground/90"
        >
          {role}
        </Badge>
      ))}
    </div>
  )
}
