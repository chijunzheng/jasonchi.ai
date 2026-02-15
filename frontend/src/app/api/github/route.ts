import { NextResponse } from 'next/server'

const GITHUB_USERNAME = 'jasonchi'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CachedData {
  data: ContributionData
  timestamp: number
}

interface ContributionDay {
  contributionCount: number
  date: string
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface ContributionData {
  totalContributions: number
  weeks: ContributionWeek[]
}

let cache: CachedData | null = null

const GRAPHQL_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`

async function fetchGitHubContributions(): Promise<ContributionData> {
  const token = process.env.GITHUB_TOKEN

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: GRAPHQL_QUERY,
      variables: { username: GITHUB_USERNAME },
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`)
  }

  const json = await response.json()
  const calendar =
    json.data?.user?.contributionsCollection?.contributionCalendar

  if (!calendar) {
    throw new Error('Invalid response structure')
  }

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
  }
}

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const data = await fetchGitHubContributions()
    cache = { data, timestamp: Date.now() }

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch {
    // Return fallback data if API fails
    if (cache) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'STALE' },
      })
    }

    return NextResponse.json(
      { totalContributions: 0, weeks: [] },
      { status: 200, headers: { 'X-Cache': 'FALLBACK' } },
    )
  }
}
