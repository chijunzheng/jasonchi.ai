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
        className={`${sizeMap[size]} overflow-hidden rounded-full bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to p-[2px]`}
      >
        <div className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-card text-lg font-bold`}>
          <span className="bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to bg-clip-text text-transparent">
            JC
          </span>
        </div>
      </div>
    </div>
  )
}
