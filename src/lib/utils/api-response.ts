import { NextResponse } from "next/server";
import { ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import { AppError } from "@/lib/errors/app-error";
import { ZodError } from "zod";

export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  statusCode = 500,
  code = "INTERNAL_ERROR",
  details?: ApiErrorDetail[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    return errorResponse("Validation failed", 400, "VALIDATION_ERROR", details);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, "INTERNAL_ERROR");
  }

  return errorResponse("An unexpected internal error occurred", 500, "INTERNAL_ERROR");
}
