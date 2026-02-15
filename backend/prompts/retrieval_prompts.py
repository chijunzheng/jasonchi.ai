"""Prompt templates for the reflective agentic retrieval pipeline."""

DECOMPOSE_PROMPT = """Decompose the following resume content into atomic propositions — individual facts that can stand alone.

Rules:
- Each proposition should be a single, self-contained fact
- Include specific names, numbers, technologies, and outcomes
- Preserve the section context (which heading it came from)
- Skip TODO placeholders and template text entirely
- If content is mostly templates/TODOs, extract only actual facts present

Content category: {category}

Content:
{content}

Return a JSON array of objects, each with "text" (the atomic fact) and "section" (the heading it belongs under).
Example: [{{"text": "Built a microservices architecture serving 2M requests/day", "section": "What I Did"}}]

Return ONLY the JSON array, nothing else. If no meaningful facts can be extracted, return [].
"""

ASSESS_PROMPT = """You are a retrieval assessment agent for a resume AI assistant. Given a user question and available content summaries, determine:
1. Your confidence that you can answer WITHOUT additional retrieval (0.0-1.0)
2. If retrieval is needed, what retrieval strategy to use

Available content summaries:
{summaries}

Previous conversation context:
{history}

User question: {question}

Respond with ONLY a JSON object:
{{
  "confidence": <float 0.0-1.0>,
  "reasoning": "<why this confidence level>",
  "needs_retrieval": <boolean>,
  "retrieval_plan": {{
    "method": "<quick_scan | deep_retrieve | full_context>",
    "categories": ["<category1>", "<category2>"],
    "search_query": "<refined query for retrieval>"
  }}
}}

Guidelines:
- confidence > 0.7: Simple greetings, meta questions about the site, questions answerable from summaries alone
- confidence 0.4-0.7: Questions that need some specific details but topic is clear
- confidence < 0.4: Questions requiring specific facts, numbers, or cross-category synthesis
- quick_scan: Simple factual questions about a clear topic
- deep_retrieve: Questions about specific experiences, skills, or achievements
- full_context: Broad questions, cover letters, or questions needing the complete picture

Return ONLY the JSON object.
"""

EVALUATE_PROMPT = """You are a retrieval quality evaluator for a resume AI assistant. Assess whether the retrieved context is sufficient to answer the user's question.

User question: {question}

Retrieved context:
{context}

Sources used: {sources}

Evaluate and respond with ONLY a JSON object:
{{
  "sufficiency_score": <float 0.0-1.0>,
  "reasoning": "<why this score>",
  "missing_info": "<what's missing, if anything>",
  "suggestion": "<sufficient | need_more | try_different_category>",
  "alternative_categories": ["<category>"]
}}

Guidelines:
- score >= 0.6: Context contains enough relevant information to answer well
- score 0.3-0.6: Partial information, could benefit from more context
- score < 0.3: Insufficient, need a different retrieval approach

Return ONLY the JSON object.
"""
