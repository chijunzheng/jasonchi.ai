interface AvatarWithStatusProps {
  readonly size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
} as const

export function AvatarWithStatus({ size = 'lg' }: AvatarWithStatusProps) {
  return (
    <div className="relative inline-block">
      <div
        className={`${sizeMap[size]} overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-primary/45 p-[2px] shadow-[0_14px_28px_oklch(0_0_0_/_18%)]`}
      >
        <div
          className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-card/95 font-heading text-lg font-semibold text-primary ring-1 ring-border/70`}
        >
          <span>JC</span>
        </div>
      </div>
    </div>
  )
}
