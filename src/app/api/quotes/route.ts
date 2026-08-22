import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { quoteService } from "@/services/quote/quote.service";
import { calculateQuoteSchema } from "@/schemas/quote.schema";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const validatedData = calculateQuoteSchema.parse(body);
    const quote = await quoteService.calculateQuote(validatedData);

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error);
  }
}
