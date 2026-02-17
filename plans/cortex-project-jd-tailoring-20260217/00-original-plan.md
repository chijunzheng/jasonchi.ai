# Original Plan: Ensure Cortex Appears + Stronger JD-Tailored Project Responses

**Created:** 2026-02-17

## Problem
- Project responses can omit Cortex due to category fast-path context truncation.
- JD-tailored behavior in backend category responses is weaker than expected.

## Goals
1. Ensure project context includes representative coverage of all flagship projects (including Cortex) under truncation.
2. Strengthen project/category instructions so responses naturally map content to active JD requirements.
3. Keep frontend and backend prompt guidance aligned.

## Implementation
1. Update backend fast-path truncation for `projects` to balanced multi-section context.
2. Add JD-aware category instruction selection in backend prompt templates + QA node.
3. Update frontend project prompts (standard + JD-tailored) to include Cortex and explicit relevance mapping.
4. Validate with lint/type/compile checks.
