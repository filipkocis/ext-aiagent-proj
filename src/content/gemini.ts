import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentConfig } from "@google/genai";
import * as config from '../config'
import type { Data } from "./Content";

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

const genConfig: GenerateContentConfig = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      is_sales_page: {
        type: Type.BOOLEAN,
      },
      products: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            product_name: {
              type: Type.STRING,
            },
            product_info: {
              type: Type.STRING,
            },
            selector: {
              type: Type.STRING,
            },
          }
        }
      }
    }
  }
}

async function getResponse(structured: boolean) {
  console.log(`Running scan... ${structured}`);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-exp-03-25",
    contents: content,
    config: structured ? genConfig : undefined,
  })
  return response.text || "";
}

async function parseFirstStage(text: string) {
  try {
    const trimmed = text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    const json = JSON.parse(trimmed);
    if (json.is_sales_page === undefined || json.products === undefined) {
      throw new Error("Invalid JSON structure");
    }
    return json;
  } catch (error) {
    const response = await getResponse(true)
    return JSON.parse(response)
  }
}

export async function runScan(setData: (data: Data) => void) {
  setData({
    status: "Loading...",
    is_sales_page: false,
    items: [],
  })

  let json = null;
  try {
    const response = await getResponse(false);
    json = await parseFirstStage(response);
  } catch (error) {
    console.error("Error parsing response:", error);

    setData({
      status: "Error",
      is_sales_page: false,
      items: []
    })
    return;
  }

  setData({
    status: "Finished",
    is_sales_page: json.is_sales_page,
    items: json.products.map((item: any) => ({
      ...item,
      valid: false
    })),
  })
}

const content = `You are a sales assistant analyzing a web page.

Your task is to detect whether the user is on a sales page. A sales page contains product or service listings, such as Amazon product pages, Shopify stores, or SaaS landing pages.

Below is a partial DOM snapshot of the most relevant elements (e.g., product cards):

${document.documentElement.outerHTML}

Based on this:
- Is this a sales page?
- If yes, extract a list of all products shown.

Return a **strict JSON object** with the following shape:
{
  "is_sales_page": true/false,
  "products": [
    {
      "product_name": "Product name (required, cannot be empty)",
      "product_info": "Short product description (required, inferred from card text if necessary)"
      "selector": "CSS selector for the product card",
    },
    ...
  ]
}

Rules:
- If description is not clearly present, infer it from surrounding text or product name/category.
- The selector must be VALID and uniquely point to the full product card, not just the image or title.
- Use concise but specific CSS selectors, must be valid for use with 'document.querySelector'.
- Do not omit any required fields. Every product must have all three fields populated.
- If product name or description is not clearly present, infer it from surrounding text or the context of the DOM/HTML. As last resort, make up some vague description if all previous rules have failed
- Description field CANNOT be empty, but MUST be short and concise. Use the product name, or product price, or website context to derive/infer the description

Only output the final JSON object as text, so it can be directly copied and parsed`;
