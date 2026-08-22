export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ApiClientError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiClientError(
      err.message || "Network request failed. Please check your connection.",
      0,
      "NETWORK_ERROR"
    );
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  let payload: ApiResponse<T> | null = null;

  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message = payload?.error?.message || response.statusText || "Request failed";
    const code = payload?.error?.code || `HTTP_${response.status}`;
    const details = payload?.error?.details;

    throw new ApiClientError(message, response.status, code, details);
  }

  return (payload ? payload.data : null) as T;
}
