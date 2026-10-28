"""
LLM Generation Service with Gemini API integration and Grounded Fallback Engine.
Provides transparent provenance (gemini-llm vs grounded-fallback) and rigorous quality checks.
"""

import os
import json
import re
import logging
from typing import Dict, Any, List, Tuple
import httpx
from ..schemas.product import ProductInput, ProductOutput
from .prompt_builder import SYSTEM_PROMPT, build_generation_prompt

logger = logging.getLogger("generation_service")


class GenerationService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def is_llm_configured(self) -> bool:
        """Returns True if a Gemini API key is provided."""
        return bool(self.api_key and len(self.api_key) > 5)

    def generate(self, product: ProductInput) -> ProductOutput:
        """
        Generates product copy for a single product.
        Attempts Gemini LLM generation if configured, otherwise uses the grounded fallback engine.
        """
        warnings: List[str] = []

        if self.is_llm_configured():
            try:
                raw_json = self._call_gemini_api(product)
                parsed = self._clean_and_parse_json(raw_json)
                if parsed:
                    return self._build_validated_output(
                        product=product,
                        data=parsed,
                        mode="gemini-llm",
                        warnings=warnings,
                    )
                else:
                    warnings.append("Gemini response could not be parsed as JSON; fallback generator activated.")
            except Exception as e:
                logger.warning(f"Gemini API invocation failed: {str(e)}. Using grounded fallback.")
                warnings.append(f"Gemini API unavailable ({str(e)[:100]}); transparently switched to grounded fallback.")
        else:
            warnings.append("No GEMINI_API_KEY detected in backend environment; utilizing deterministic grounded generator.")

        # Grounded Fallback Generation
        fallback_data = self._generate_grounded_fallback(product)
        return self._build_validated_output(
            product=product,
            data=fallback_data,
            mode="grounded-fallback",
            warnings=warnings,
        )

    def _call_gemini_api(self, product: ProductInput) -> str:
        """Calls the Google Gemini API with system instruction and user prompt."""
        user_prompt = build_generation_prompt(product)
        endpoint = f"{self.api_url}?key={self.api_key}"

        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.9,
                "maxOutputTokens": 1024,
                "responseMimeType": "application/json"
            }
        }

        with httpx.Client(timeout=20.0) as client:
            resp = client.post(endpoint, json=payload, headers={"Content-Type": "application/json"})
            resp.raise_for_status()
            data = resp.json()

            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No generation candidate returned by Gemini API.")
            
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise ValueError("Empty candidate content from Gemini API.")
            
            return parts[0].get("text", "")

    def _clean_and_parse_json(self, raw_text: str) -> Dict[str, Any]:
        """Cleans potential markdown wrapping and parses JSON output."""
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Attempt to extract substring between first { and last }
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1:
                return json.loads(cleaned[start:end+1])
            raise

    def _generate_grounded_fallback(self, product: ProductInput) -> Dict[str, Any]:
        """
        Deterministic, high-quality rule-based copy engine strictly grounded on input facts.
        Respects category, tone, features, specs, and audience without hallucinating facts.
        """
        features_list = [f.strip() for f in re.split(r"[,;\n•]+", product.features) if f.strip()]
        features_str = ", ".join(features_list) if features_list else product.features
        audience_str = product.audience or "discerning shoppers"
        brand_prefix = f"{product.brand} " if product.brand else ""

        # Extract or construct SEO keywords
        keywords_list = []
        if product.keywords:
            keywords_list = [k.strip() for k in product.keywords.split(",") if k.strip()]
        if len(keywords_list) < 4:
            keywords_list.append(product.name.lower())
            if product.category:
                keywords_list.append(f"best {product.category.lower()}")
            for feat in features_list[:3]:
                feat_clean = feat.lower()
                if len(feat_clean) < 30 and feat_clean not in keywords_list:
                    keywords_list.append(feat_clean)
        keywords_list = list(dict.fromkeys(keywords_list))[:6]

        tone = product.tone.lower()

        # Tone-specific phrase banks
        if "premium" in tone:
            intro = f"Experience elevated distinction with the {brand_prefix}{product.name}, masterfully tailored for {audience_str}."
            body_p1 = (
                f"Designed with meticulous attention to detail, every element is curated for enduring satisfaction. "
                f"It brings together {features_str} to deliver an unmatched standard of refined utility and everyday luxury."
            )
            body_p2 = (
                f"Whether elevating your personal routine or making a statement of enduring quality, "
                f"the {product.name} offers discerning sophistication you can depend on."
            )
            short = f"Sophisticated and exquisitely crafted, the {product.name} unites {features_list[0] if features_list else 'exceptional design'} with timeless refinement."
            meta = f"Discover the {product.name}. Featuring {features_list[0] if features_list else 'premium design'}, created for {audience_str}. Order yours today."
        elif "minimal" in tone:
            intro = f"{brand_prefix}{product.name} delivers focused performance for {audience_str}."
            body_p1 = f"Built around essential utility: {features_str}. No unnecessary bulk, just reliable execution."
            body_p2 = f"A purposeful addition to your everyday toolkit that does exactly what it promises."
            short = f"Streamlined and dependable: {product.name} featuring {features_str}."
            meta = f"Shop {product.name}: {features_list[0] if features_list else 'essential performance'}. Clean, efficient, and built for {audience_str}."
        elif "professional" in tone:
            intro = f"The {brand_prefix}{product.name} is engineered to meet the demanding standards of {audience_str}."
            body_p1 = (
                f"Combining verified capabilities including {features_str}, this product delivers consistent, "
                f"repeatable performance across demanding commercial or personal applications."
            )
            body_p2 = (
                f"Built for reliability and optimized utility, it provides a sound investment for individuals "
                f"who prioritize functional excellence and durability."
            )
            short = f"Reliable, high-performance {product.category or 'product'}: the {product.name} offers {features_list[0] if features_list else 'precision utility'}."
            meta = f"Engineered for {audience_str}: {product.name} with {features_list[0] if features_list else 'proven specifications'}. Inquire today."
        elif "urgent" in tone or "persuasive" in tone:
            intro = f"Upgrade your daily experience with the all-new {brand_prefix}{product.name}!"
            body_p1 = (
                f"Why settle for less when you can have {features_str}? Specially tailored for {audience_str}, "
                f"it solves your everyday challenges with effortless confidence."
            )
            body_p2 = (
                f"Do not miss the opportunity to transform your routine. "
                f"Get the {product.name} today and experience the difference immediately!"
            )
            short = f"Transform your routine today with {product.name}—engineered with {features_str} for fast results!"
            meta = f"Upgrade now with {product.name}! Equipped with {features_list[0] if features_list else 'top features'} for {audience_str}. Shop today!"
        else:  # Friendly (default)
            intro = f"Meet the {brand_prefix}{product.name}—the perfect everyday companion for {audience_str}!"
            body_p1 = (
                f"Thoughtfully created to make life easier and more enjoyable, it offers {features_str}. "
                f"From your very first use, you will appreciate how effortlessly it integrates into your day."
            )
            body_p2 = (
                f"Whether treating yourself or searching for the ideal solution for your lifestyle, "
                f"the {product.name} delivers dependable joy and practical convenience."
            )
            short = f"Brighten your everyday routine with the friendly, dependable {product.name}, packed with {features_list[0] if features_list else 'thoughtful features'}."
            meta = f"Bring home the {product.name}! Enjoy {features_list[0] if features_list else 'great features'} tailored for {audience_str}. Check it out now!"

        if product.specifications:
            body_p2 += f"\n\nKey Specifications: {product.specifications}."
        if product.price:
            body_p2 += f"\nAvailable at an accessible value of {product.price} {product.currency}."

        full_description = f"{intro}\n\n{body_p1}\n\n{body_p2}"

        # Clean meta description length strictly
        if len(meta) > 160:
            meta = meta[:157] + "..."

        return {
            "short_description": short,
            "description": full_description,
            "seo_keywords": keywords_list,
            "meta_description": meta,
        }

    def _build_validated_output(
        self,
        product: ProductInput,
        data: Dict[str, Any],
        mode: str,
        warnings: List[str]
    ) -> ProductOutput:
        """Applies post-generation quality checks, grounding inspection, and length validation."""
        short_desc = str(data.get("short_description", "")).strip()
        description = str(data.get("description", "")).strip()
        meta_desc = str(data.get("meta_description", "")).strip()
        seo_keywords = data.get("seo_keywords", [])
        if isinstance(seo_keywords, str):
            seo_keywords = [k.strip() for k in seo_keywords.split(",") if k.strip()]

        # Check required fields presence
        if not short_desc:
            short_desc = f"{product.name} featuring {product.features}."
            warnings.append("Short description was empty; generated fallback summary.")
        if not description:
            description = f"Introducing {product.name}. Highlights include: {product.features}."
            warnings.append("Detailed description was empty; generated fallback copy.")
        if not meta_desc:
            meta_desc = f"Discover {product.name}. Designed for {product.audience or 'customers'} with {product.features}."
            warnings.append("Meta description was empty; generated fallback search snippet.")

        # Length check for meta description
        meta_len = len(meta_desc)
        if meta_len > 160:
            warnings.append(
                f"Meta description exceeded standard 160-character SERP limit ({meta_len} chars). Snippet truncated."
            )
            meta_desc = meta_desc[:157].rstrip() + "..."
            meta_len = len(meta_desc)

        # Grounding compliance audit (detect common unsupported hallucinations)
        unsupported_phrases = [
            "lifetime warranty",
            "10-year warranty",
            "fda approved",
            "100% waterproof",
            "cure",
            "guaranteed to heal",
        ]
        input_text_lower = f"{product.name} {product.features} {product.specifications}".lower()
        output_text_lower = f"{short_desc} {description} {meta_desc}".lower()

        for phrase in unsupported_phrases:
            if phrase in output_text_lower and phrase not in input_text_lower:
                warnings.append(f"Grounding Alert: Phrase '{phrase}' detected in copy but not supported by input facts.")

        return ProductOutput(
            product_id=product.product_id,
            name=product.name,
            category=product.category,
            tone=product.tone,
            short_description=short_desc,
            description=description,
            seo_keywords=seo_keywords,
            meta_description=meta_desc,
            generation_mode=mode,
            meta_char_count=meta_len,
            warnings=warnings,
        )


# Singleton instance
generation_service = GenerationService()
