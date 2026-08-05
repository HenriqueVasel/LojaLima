export interface CatalogAttribute {
  name: string;
  value: string;
}

export interface CatalogResult {
  category?: string;
  brand?: string;
  line?: string;
  attributes: CatalogAttribute[];
}

import { CATEGORY_RULES } from "@/app/lib/catalog/categoryRules";
import { LINE_RULES } from "@/app/lib/catalog/lineRules";
import { ATTRIBUTE_RULES } from "@/app/lib/catalog/attributeRules";




export function analyzeProduct(product: {
  name: string;
  brand?: string | null;
}): CatalogResult {

  const text =
    (
      product.name +
      " " +
      (product.brand || "")
    ).toLowerCase();

const result: CatalogResult = {
    brand: undefined,
    attributes: [],
};

result.brand = product.brand || undefined;

  for (const rule of CATEGORY_RULES) {

    if (
      rule.keywords.some((k) =>
        text.includes(k)
      )
    ) {

      result.category = rule.slug;

      break;

    }

  }

  for (const line of LINE_RULES) {

  if (
    line.keywords.some((keyword) =>
      text.includes(keyword)
    )
  ) {

    result.line = line.name;

    break;

  }

}




for (const rule of ATTRIBUTE_RULES) {

  const categoryMatches =
    !result.category ||
    rule.categories.includes(result.category);

  if (!categoryMatches) {
    continue;
  }

  const keywordMatches =
    rule.keywords.some((keyword) =>
      text.includes(keyword)
    );

  if (keywordMatches) {

    result.attributes.push({
      name: rule.attribute,
      value: rule.value,
    });

  }

}
  return result;

}