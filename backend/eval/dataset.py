"""Curated evaluation dataset — 50 questions across 5 difficulty tiers."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EvalQuestion:
    """A single evaluation question with ground truth metadata."""

    question: str
    expected_categories: tuple[str, ...]
    difficulty: str  # trivial | single_fact | category | cross | global
    ground_truth_answer: str


# Tier 1: Trivial — Self-RAG should skip retrieval (confidence > 0.7)
TRIVIAL_QUESTIONS = [
    EvalQuestion(
        question="What's your name?",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="Jason Chi",
    ),
    EvalQuestion(
        question="Hi there!",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="Hello! I'm Jason's AI assistant.",
    ),
    EvalQuestion(
        question="How are you?",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="I'm here to help you learn about Jason's experience!",
    ),
    EvalQuestion(
        question="What can you help me with?",
        expected_categories=("meta",),
        difficulty="trivial",
        ground_truth_answer="I can answer questions about Jason's work experience, projects, skills, and more.",
    ),
    EvalQuestion(
        question="Thanks!",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="You're welcome! Let me know if you have more questions.",
    ),
    EvalQuestion(
        question="Who made this site?",
        expected_categories=("meta",),
        difficulty="trivial",
        ground_truth_answer="Jason Chi built this site as an interactive AI resume.",
    ),
    EvalQuestion(
        question="Is this an AI?",
        expected_categories=("meta",),
        difficulty="trivial",
        ground_truth_answer="Yes, I'm an AI assistant powered by Gemini.",
    ),
    EvalQuestion(
        question="What's the weather?",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="I focus on Jason's resume. I can't check the weather.",
    ),
    EvalQuestion(
        question="Tell me a joke",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="I'm better at talking about Jason's experience than comedy!",
    ),
    EvalQuestion(
        question="Goodbye",
        expected_categories=(),
        difficulty="trivial",
        ground_truth_answer="Goodbye! Feel free to come back anytime.",
    ),
]

# Tier 2: Single-fact — quick_scan should suffice
SINGLE_FACT_QUESTIONS = [
    EvalQuestion(
        question="What language is this site built in?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="TypeScript with Next.js 16.",
    ),
    EvalQuestion(
        question="What AI model powers this site?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Google Gemini 2.0 Flash.",
    ),
    EvalQuestion(
        question="Where is this site hosted?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Vercel.",
    ),
    EvalQuestion(
        question="Is my data stored?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="No user data is stored permanently.",
    ),
    EvalQuestion(
        question="What frontend framework is used?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Next.js 16 with Tailwind CSS and shadcn/ui.",
    ),
    EvalQuestion(
        question="What CSS framework do you use?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Tailwind CSS.",
    ),
    EvalQuestion(
        question="Do you use cookies?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="No cookies beyond theme preference.",
    ),
    EvalQuestion(
        question="What component library is used?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="shadcn/ui.",
    ),
    EvalQuestion(
        question="How are responses streamed?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Streaming responses via Gemini 2.0 Flash.",
    ),
    EvalQuestion(
        question="What format is the content stored in?",
        expected_categories=("meta",),
        difficulty="single_fact",
        ground_truth_answer="Markdown files with story-based structure.",
    ),
]

# Tier 3: Category-specific — deep_retrieve on one category
CATEGORY_QUESTIONS = [
    EvalQuestion(
        question="Tell me about your work experience",
        expected_categories=("work-experience",),
        difficulty="category",
        ground_truth_answer="Detailed work history with specific roles and achievements.",
    ),
    EvalQuestion(
        question="What projects have you built?",
        expected_categories=("projects",),
        difficulty="category",
        ground_truth_answer="Description of personal and professional projects.",
    ),
    EvalQuestion(
        question="What are your strongest technical skills?",
        expected_categories=("skills",),
        difficulty="category",
        ground_truth_answer="Technical skills with proficiency levels.",
    ),
    EvalQuestion(
        question="Tell me about your education",
        expected_categories=("education",),
        difficulty="category",
        ground_truth_answer="Educational background and certifications.",
    ),
    EvalQuestion(
        question="What are you still learning?",
        expected_categories=("honest-section",),
        difficulty="category",
        ground_truth_answer="Current learning areas and growth goals.",
    ),
    EvalQuestion(
        question="What kind of role are you looking for?",
        expected_categories=("honest-section",),
        difficulty="category",
        ground_truth_answer="Ideal role description and preferences.",
    ),
    EvalQuestion(
        question="How do you work best?",
        expected_categories=("honest-section",),
        difficulty="category",
        ground_truth_answer="Working style and collaboration preferences.",
    ),
    EvalQuestion(
        question="What cloud platforms have you used?",
        expected_categories=("skills",),
        difficulty="category",
        ground_truth_answer="Cloud platform experience (AWS, GCP, etc.).",
    ),
    EvalQuestion(
        question="Do you have AI/ML experience?",
        expected_categories=("skills",),
        difficulty="category",
        ground_truth_answer="AI and ML skills with specific models and practices.",
    ),
    EvalQuestion(
        question="Why did you build this site?",
        expected_categories=("meta",),
        difficulty="category",
        ground_truth_answer="Motivation for building an AI-powered resume.",
    ),
]

# Tier 4: Cross-category — deep_retrieve across multiple categories
CROSS_QUESTIONS = [
    EvalQuestion(
        question="How do your skills relate to your projects?",
        expected_categories=("skills", "projects"),
        difficulty="cross",
        ground_truth_answer="Connection between technical skills and project implementations.",
    ),
    EvalQuestion(
        question="How has your education influenced your career?",
        expected_categories=("education", "work-experience"),
        difficulty="cross",
        ground_truth_answer="Link between educational background and professional trajectory.",
    ),
    EvalQuestion(
        question="What technical decisions have you made in your projects?",
        expected_categories=("projects", "skills"),
        difficulty="cross",
        ground_truth_answer="Specific technical decisions with rationale.",
    ),
    EvalQuestion(
        question="How does your work experience demonstrate your skills?",
        expected_categories=("work-experience", "skills"),
        difficulty="cross",
        ground_truth_answer="Evidence of skills applied in professional settings.",
    ),
    EvalQuestion(
        question="What challenges have you faced and how did you grow?",
        expected_categories=("honest-section", "work-experience"),
        difficulty="cross",
        ground_truth_answer="Honest challenges with growth stories.",
    ),
    EvalQuestion(
        question="What's the most impressive thing you've built and what skills did it require?",
        expected_categories=("projects", "skills"),
        difficulty="cross",
        ground_truth_answer="Showcase project with technical skill requirements.",
    ),
    EvalQuestion(
        question="How does this AI resume demonstrate your engineering ability?",
        expected_categories=("meta", "skills"),
        difficulty="cross",
        ground_truth_answer="Technical showcase aspects of the resume site.",
    ),
    EvalQuestion(
        question="What leadership experience do you have from work and projects?",
        expected_categories=("work-experience", "skills"),
        difficulty="cross",
        ground_truth_answer="Leadership examples from both professional and personal work.",
    ),
    EvalQuestion(
        question="How do your weaknesses relate to your learning goals?",
        expected_categories=("honest-section", "education"),
        difficulty="cross",
        ground_truth_answer="Self-awareness connecting weaknesses to development goals.",
    ),
    EvalQuestion(
        question="Tell me about your full-stack experience across work and projects",
        expected_categories=("work-experience", "projects", "skills"),
        difficulty="cross",
        ground_truth_answer="Full-stack evidence from multiple sources.",
    ),
]

# Tier 5: Global/abstract — full_context + synthesis
GLOBAL_QUESTIONS = [
    EvalQuestion(
        question="What makes you unique as a candidate?",
        expected_categories=("work-experience", "projects", "skills", "honest-section"),
        difficulty="global",
        ground_truth_answer="Unique value proposition synthesized from all experience.",
    ),
    EvalQuestion(
        question="Give me a 30-second elevator pitch",
        expected_categories=("work-experience", "projects", "skills"),
        difficulty="global",
        ground_truth_answer="Concise summary of qualifications and value.",
    ),
    EvalQuestion(
        question="Why should we hire you?",
        expected_categories=("work-experience", "projects", "skills", "honest-section"),
        difficulty="global",
        ground_truth_answer="Compelling case with specific evidence.",
    ),
    EvalQuestion(
        question="Summarize your entire background",
        expected_categories=("work-experience", "education", "skills", "projects"),
        difficulty="global",
        ground_truth_answer="Comprehensive career summary.",
    ),
    EvalQuestion(
        question="What would your colleagues say about you?",
        expected_categories=("honest-section", "work-experience"),
        difficulty="global",
        ground_truth_answer="Third-person perspective on working style and impact.",
    ),
    EvalQuestion(
        question="How would you fit into a fast-paced startup?",
        expected_categories=("work-experience", "honest-section", "skills"),
        difficulty="global",
        ground_truth_answer="Fit assessment with specific evidence.",
    ),
    EvalQuestion(
        question="What's your approach to solving complex technical problems?",
        expected_categories=("work-experience", "projects", "skills"),
        difficulty="global",
        ground_truth_answer="Problem-solving methodology with examples.",
    ),
    EvalQuestion(
        question="Tell me everything about yourself",
        expected_categories=("work-experience", "projects", "skills", "education", "honest-section"),
        difficulty="global",
        ground_truth_answer="Complete professional narrative.",
    ),
    EvalQuestion(
        question="If I could only read one thing about you, what should it be?",
        expected_categories=("work-experience", "projects"),
        difficulty="global",
        ground_truth_answer="Most impactful highlight selected and justified.",
    ),
    EvalQuestion(
        question="What's your career vision for the next 5 years?",
        expected_categories=("honest-section", "skills"),
        difficulty="global",
        ground_truth_answer="Forward-looking vision grounded in current trajectory.",
    ),
]

# Full dataset
EVAL_DATASET: list[EvalQuestion] = (
    TRIVIAL_QUESTIONS
    + SINGLE_FACT_QUESTIONS
    + CATEGORY_QUESTIONS
    + CROSS_QUESTIONS
    + GLOBAL_QUESTIONS
)
