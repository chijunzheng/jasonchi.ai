# Feature: Contribution Heatmap

**ID:** F9
**Tier:** 4 — Engagement
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Medium
**Dependencies:** F0

## Description

Display a GitHub-style contribution heatmap showing the last 12 weeks of activity. Uses GitHub's GraphQL API with server-side caching. Shows streak count, last commit time, and monthly total.

## Acceptance Criteria

- [ ] SVG heatmap grid renders last 12 weeks of contributions
- [ ] 4 intensity levels (0, 1-3, 4-7, 8+) with appropriate colors
- [ ] `GET /api/github` proxies and caches GitHub data
- [ ] 1-hour server-side cache to avoid rate limits
- [ ] Shows: current streak, last commit time, monthly contribution total
- [ ] Graceful fallback if GitHub API is unavailable
- [ ] Responsive on mobile (horizontal scroll or compact view)

## Implementation Details

### Files to Create

- `frontend/src/app/api/github/route.ts` — Cached GitHub proxy
- `frontend/src/components/activity/contribution-heatmap.tsx` — SVG heatmap
- `frontend/src/components/activity/activity-stats.tsx` — Streak, last commit, total

### GitHub GraphQL Query

```graphql
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
}
```

### Heatmap Grid

```
Each cell: 12×12px square with 2px gap
Colors: bg-muted (0), green-200 (1-3), green-400 (4-7), green-600 (8+)
Grid: 12 columns (weeks) × 7 rows (days)
Labels: Month abbreviations on top
```

### Technical Decisions

- **GitHub GraphQL over REST:** Single request for all contribution data vs. multiple REST calls
- **Server-side caching:** Prevents rate limiting, 1-hour TTL is fresh enough
- **SVG over canvas:** Better accessibility, easier theming, works with dark mode
- **12 weeks over 52:** Compact view that still shows recent activity pattern

## Dependencies

### Depends On
- **F0:** Design tokens, layout structure

### Blocks
- None

## Testing Requirements

- [ ] Heatmap renders with correct grid dimensions
- [ ] Color intensities map correctly to contribution counts
- [ ] Cache prevents excessive GitHub API calls
- [ ] Fallback UI shows when API is unavailable
- [ ] Stats (streak, last commit, total) display correctly

## Implementation Checklist

- [ ] Create app/api/github/route.ts with caching
- [ ] Create contribution-heatmap.tsx SVG component
- [ ] Create activity-stats.tsx
- [ ] Wire into page layout
- [ ] Test with mock data and real GitHub API
- [ ] Add .env.local entry for GITHUB_TOKEN (optional for public data)

## Notes

- GitHub username should come from `lib/constants.ts`
- Public contribution data doesn't require authentication, but a token increases rate limits
- The heatmap replaces the original "progress bar" design — it's more visual and honest
- Consider lazy-loading this component since it's below the fold

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
