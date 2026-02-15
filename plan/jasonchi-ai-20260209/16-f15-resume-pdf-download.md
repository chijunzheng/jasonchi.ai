# Feature: Resume PDF Download

**ID:** F15
**Tier:** 5 — Polish
**Status:** ✅ Completed
**Priority:** Low
**Estimated Complexity:** Small
**Dependencies:** F12

## Description

Provide a downloadable PDF resume with embedded links that funnel back to the website. The PDF should be ATS-compatible with standard section headers.

## Acceptance Criteria

- [ ] "Download Resume" button triggers PDF download
- [ ] PDF includes: header with site URL, experience, skills, education
- [ ] All links in PDF are clickable hyperlinks
- [ ] ATS-parseable text content (no images for text)
- [ ] Curiosity hook section: "Why is this resume short?" pointing to jasonchi.ai
- [ ] Download event tracked via analytics

## Implementation Details

### Approach Options

1. **Static PDF in public/:** Pre-built PDF, simplest approach
2. **Generated via react-pdf:** Dynamic, stays in sync with content
3. **Generated via Puppeteer:** HTML-to-PDF, most flexible

### Recommended: Static PDF (MVP)

- Place pre-built `resume.pdf` in `public/`
- "Download Resume" button links to `/resume.pdf`
- Update manually when content changes
- Track download with analytics event

### Files to Create

- `frontend/public/resume.pdf` — Static resume PDF
- Update header download button to link to PDF

## Dependencies

### Depends On
- **F12:** Analytics for download tracking

### Blocks
- None

## Implementation Checklist

- [ ] Create or place resume PDF in public/
- [ ] Wire download button in header
- [ ] Add analytics event on download
- [ ] Verify PDF links are clickable

## Notes

- Start with static PDF for MVP. Dynamic generation is Phase 2 if content changes frequently.
- The PDF should explicitly drive traffic back to jasonchi.ai with multiple CTAs embedded in the document.

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
