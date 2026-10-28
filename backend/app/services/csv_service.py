"""
CSV processing service for batch generation and results export.
Handles UTF-8/BOM encoding, flexible column mapping, row validation, and streaming export.
"""

import io
import csv
import time
from typing import List, Tuple, Dict, Any, Optional
from ..schemas.product import ProductInput, ProductOutput, BatchItemError, BatchResponse
from .generation import generation_service


COLUMN_ALIASES = {
    "product_id": ["product_id", "id", "sku", "item_id", "product_code"],
    "name": ["name", "product_name", "title", "product_title", "item_name"],
    "category": ["category", "product_category", "department", "type"],
    "features": ["features", "key_features", "feature_list", "highlights", "description_points", "bullets"],
    "specifications": ["specifications", "specs", "technical_specs", "tech_specs"],
    "price": ["price", "cost", "mrp", "retail_price"],
    "currency": ["currency", "curr"],
    "audience": ["audience", "target_audience", "customer_segment"],
    "keywords": ["keywords", "seo_keywords", "search_terms", "tags"],
    "brand": ["brand", "brand_name", "manufacturer"],
    "tone": ["tone", "brand_voice", "style"],
}


class CsvService:
    @staticmethod
    def _map_header(header: str) -> Optional[str]:
        cleaned = header.strip().lower().replace(" ", "_").replace("-", "_")
        for canonical, aliases in COLUMN_ALIASES.items():
            if cleaned in aliases:
                return canonical
        return None

    def parse_and_process_csv(self, file_content: bytes, default_tone: str = "Friendly") -> BatchResponse:
        start_time = time.time()

        # Decode with utf-8-sig to automatically handle byte order mark
        try:
            text = file_content.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                text = file_content.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Unable to decode CSV file: {str(e)}")

        lines = [line for line in text.splitlines() if line.strip()]
        if not lines:
            raise ValueError("The uploaded CSV file is empty.")

        # Detect dialect / delimiter
        sample = "\n".join(lines[:10])
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except Exception:
            dialect = csv.excel

        reader = csv.reader(io.StringIO(text), dialect=dialect)
        header_row = next(reader, None)
        if not header_row:
            raise ValueError("CSV file missing header row.")

        # Map headers
        column_map: Dict[int, str] = {}
        for idx, col in enumerate(header_row):
            mapped = self._map_header(col)
            if mapped:
                column_map[idx] = mapped

        # Verify that 'name' is among the mapped columns
        if "name" not in column_map.values():
            raise ValueError("CSV missing required 'name' column. Found headers: " + ", ".join(header_row))

        results: List[ProductOutput] = []
        errors: List[BatchItemError] = []
        mode_summary: Dict[str, int] = {"gemini-llm": 0, "grounded-fallback": 0}

        row_index = 1
        for row in reader:
            row_index += 1
            if not row or all(not cell.strip() for cell in row):
                continue  # skip completely blank rows

            # Extract fields according to column_map
            row_data: Dict[str, Any] = {}
            for col_idx, canonical_name in column_map.items():
                if col_idx < len(row):
                    row_data[canonical_name] = row[col_idx].strip()

            prod_name = row_data.get("name", "").strip()
            if not prod_name:
                errors.append(
                    BatchItemError(
                        row_index=row_index,
                        product_name=None,
                        error="Missing product name in row."
                    )
                )
                continue

            features = row_data.get("features", "").strip()
            if not features:
                # If features missing, use category and name as minimal grounded input with warning
                features = f"Quality {row_data.get('category', 'retail')} product: {prod_name}"

            tone_val = row_data.get("tone", "").strip() or default_tone

            try:
                product_input = ProductInput(
                    product_id=row_data.get("product_id") or f"ROW-{row_index:03d}",
                    name=prod_name,
                    category=row_data.get("category") or "General",
                    features=features,
                    specifications=row_data.get("specifications") or "",
                    price=row_data.get("price") or None,
                    currency=row_data.get("currency") or "INR",
                    audience=row_data.get("audience") or "General consumers",
                    keywords=row_data.get("keywords") or "",
                    brand=row_data.get("brand") or "",
                    tone=tone_val,
                )

                output = generation_service.generate(product_input)
                results.append(output)
                mode_summary[output.generation_mode] = mode_summary.get(output.generation_mode, 0) + 1

            except Exception as e:
                errors.append(
                    BatchItemError(
                        row_index=row_index,
                        product_name=prod_name,
                        error=str(e)
                    )
                )

        elapsed = round(time.time() - start_time, 2)
        total_rows = len(results) + len(errors)

        return BatchResponse(
            total_rows=total_rows,
            processed_count=len(results) + len(errors),
            success_count=len(results),
            error_count=len(errors),
            results=results,
            errors=errors,
            execution_time_seconds=elapsed,
            generation_mode_summary=mode_summary,
        )

    def export_to_csv(self, results: List[ProductOutput]) -> str:
        """Converts generated output records to a compliant CSV string."""
        output = io.StringIO()
        fieldnames = [
            "product_id",
            "name",
            "category",
            "tone",
            "short_description",
            "description",
            "seo_keywords",
            "meta_description",
            "meta_char_count",
            "generation_mode",
            "warnings",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()

        for item in results:
            writer.writerow({
                "product_id": item.product_id or "",
                "name": item.name,
                "category": item.category or "",
                "tone": item.tone,
                "short_description": item.short_description,
                "description": item.description,
                "seo_keywords": ", ".join(item.seo_keywords),
                "meta_description": item.meta_description,
                "meta_char_count": item.meta_char_count,
                "generation_mode": item.generation_mode,
                "warnings": "; ".join(item.warnings),
            })

        return output.getvalue()


csv_service = CsvService()
