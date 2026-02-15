import { Badge } from '@/components/ui/badge'

const companies = [
  'TODO: Company 1',
  'TODO: Company 2',
  'TODO: Company 3',
] as const

const recognitions = [
  'TODO: Recognition 1',
  'TODO: Recognition 2',
] as const

export function SocialProof() {
  return (
    <div className="rounded-2xl border bg-card/80 p-4 backdrop-blur-sm">
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Previously at
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {companies.map((company) => (
            <Badge key={company} variant="outline" className="rounded-full text-sm">
              {company}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {recognitions.map((item) => (
            <Badge key={item} variant="secondary" className="rounded-full text-xs">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
