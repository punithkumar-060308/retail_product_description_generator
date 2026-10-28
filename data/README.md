# Retail Catalog Demo Dataset

This directory contains `sample_products.csv`, an e-commerce catalog dataset specifically constructed for demonstrating and evaluating the **Retail Product Description Generator**.

## Dataset Summary
- **Total Records:** 55 distinct retail products
- **Format:** UTF-8 Comma-Separated Values (CSV)
- **Categories Covered:** Electronics, Kitchen & Dining, Outdoor & Sports, Beauty & Personal Care, Home & Living, Apparel & Footwear, Furniture, Automotive, Health, Pets, Food & Gourmet.
- **Source:** Synthetic benchmarking data created according to retail copywriting best practices. No personal or proprietary private data included.

## Column Definitions
| Column | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `product_id` | Yes (Recommended) | Stable product SKU or identifier | `P001` |
| `name` | Yes | Non-empty retail product title | `AuraWave Active Noise Cancelling Headphones` |
| `category` | Yes | Merchandising category | `Electronics` |
| `features` | Yes | Fact list / key selling points | `Hybrid ANC, 45-hour battery life, Bluetooth 5.3` |
| `specifications` | Optional | Technical specifications | `Battery: 45h, Drivers: 40mm` |
| `price` | Optional | Selling price value | `4999` |
| `currency` | Optional | Currency ISO code | `INR` |
| `audience` | Optional | Target customer segment | `Commuters and music enthusiasts` |
| `keywords` | Optional | Target SEO seed terms | `noise cancelling headphones, wireless bluetooth` |
| `brand` | Optional | Brand identifier | `AuraAudio` |
| `tone` | Optional | Preferred brand voice | `Premium`, `Friendly`, `Professional`, `Minimal`, `Urgent / Persuasive` |
