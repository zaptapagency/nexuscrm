export class ApiError extends Error {
  status: number;
  issues?: Record<string, string[]>;
  constructor(message: string, status: number, issues?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

/**
 * Thin wrapper around fetch for JSON APIs. Throws ApiError on non-2xx so
 * TanStack Query / try-catch can surface a toast.
 */
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(input, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message =
      (data && (data.error as string)) || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data?.issues);
  }
  return data as T;
}
