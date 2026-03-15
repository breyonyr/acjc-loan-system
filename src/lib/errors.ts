// ─── Error Codes ────────────────────────────────────────
export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  DATABASE_ERROR: "DATABASE_ERROR",
  CONFLICT: "CONFLICT",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Action Result Type ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ActionResult<T = {}> =
  | ({ success: true } & T)
  | { success: false; error: string; code: ErrorCode };

// ─── Helper to create error results ────────────────────
export function actionError(
  code: ErrorCode,
  message: string
): ActionResult<never> {
  return { success: false, error: message, code };
}

// ─── User-facing error messages ────────────────────────
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "You don't have permission to do this.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment.",
  DATABASE_ERROR: "Something went wrong. Please try again.",
  CONFLICT: "This resource is no longer available.",
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}
