"""
Prompt Builder Service for Retail Product Description Generation.
Encapsulates prompt construction, grounding guidelines, and tone conditioning.
"""

from typing import Dict, Any
from ..schemas.product import ProductInput

TONE_INSTRUCTIONS: Dict[str, str] = {
    "Friendly": (
        "Warm, inviting, accessible, and conversational. Speak directly to the shopper with enthusiasm, "
        "making them feel welcome, inspired, and confident in their purchase."
    ),
    "Professional": (
        "Polished, authoritative, articulate, and informative. Emphasize utility, precision, reliable "
        "engineering, and commercial or daily effectiveness without hype."
    ),
    "Premium": (
        "Luxurious, evocative, sophisticated, and aspirational. Use elevated vocabulary that celebrates craftsmanship, "
        "timeless elegance, curated distinction, and refined living."
    ),
    "Minimal": (
        "Concise, punchy, direct, and distraction-free. Deliver high impact in minimal words; focus strictly on "
        "core functionality and essential lifestyle benefit without filler."
    ),
    "Urgent / Persuasive": (
        "Dynamic, action-oriented, and high-energy. Highlight compelling benefits, problem-solving impact, "
        "and motivate confident, immediate shopping action."
    ),
    "Playful": (
        "Witty, lighthearted, cheerful, and charming. Infuse personality, fun metaphors, and smile-inducing lines "
        "while keeping product benefits crystal clear."
    ),
}

SYSTEM_PROMPT = """You are an expert e-commerce and retail copywriter.
Your task is to write high-converting, engaging, SEO-optimized product copy using STRICTLY the provided product facts.

CRITICAL GROUNDING RULES:
1. USE ONLY SUPPLIED FACTS: Do not invent, assume, or extrapolate unmentioned technical specifications, battery capacities, materials, certifications, medical claims, warranties, or performance benchmarks.
2. NO HALLUCINATION: If a detail (such as battery life, waterproof rating, material, or warranty) is not explicitly listed in the product input, OMIT IT completely. Never guess.
3. ADHERE TO BRAND VOICE: Embody the specified tone precisely.
4. SEO FOCUS: Integrate relevant search keywords naturally without keyword stuffing.
5. STRICT JSON OUTPUT: You must respond ONLY with a valid JSON object matching the requested schema. No surrounding markdown, no extra conversational preamble or postscript.

OUTPUT JSON SCHEMA:
{
  "short_description": "1 to 2 punchy, factual, customer-oriented sentences summarizing the product.",
  "description": "2 to 3 paragraphs of engaging, benefit-driven product copy highlighting key features and usage.",
  "seo_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "meta_description": "High-intent search snippet strictly under 160 characters designed for Google SERP click-through."
}
"""


def build_generation_prompt(product: ProductInput) -> str:
    """
    Constructs a well-structured prompt encapsulating all verified product attributes
    and the designated brand tone.
    """
    tone_guidance = TONE_INSTRUCTIONS.get(
        product.tone,
        f"Adopt a {product.tone} tone that is clear, engaging, and suitable for retail e-commerce."
    )

    user_prompt = f"""Please generate e-commerce product copy for the following product:

=== VERIFIED PRODUCT ATTRIBUTES ===
- Product Name: {product.name}
- Category: {product.category or 'General'}
- Key Features / Selling Points: {product.features}
- Target Audience: {product.audience or 'General consumers'}
- Price / Value: {f"{product.price} {product.currency}".strip() if product.price else 'Not specified'}
- Structured Specifications: {product.specifications if product.specifications else 'None provided'}
- Brand: {product.brand if product.brand else 'Not specified'}
- SEO Seed Keywords: {product.keywords if product.keywords else 'Derive relevant e-commerce keywords from the attributes above'}

=== DESIRED BRAND TONE ===
Tone: {product.tone}
Tone Guidance: {tone_guidance}

=== OUTPUT REQUIREMENTS ===
- Ensure 'meta_description' is compelling and strictly 160 characters or fewer.
- Ensure 'seo_keywords' has between 4 and 8 relevant terms.
- Return ONLY valid JSON adhering strictly to the required schema.
"""
    return user_prompt
