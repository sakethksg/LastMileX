import { apiClient } from "./client";
import { CalculateQuoteInput, QuoteBreakdown } from "@/types/domain";

export async function calculateQuote(input: CalculateQuoteInput): Promise<QuoteBreakdown> {
  return apiClient<QuoteBreakdown>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
