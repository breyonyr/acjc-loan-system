/**
 * Sanitize user input for use in PostgREST filter expressions.
 * Strips characters that have special meaning in PostgREST syntax:
 * commas, dots, parentheses, and asterisks.
 */
export function sanitizeFilterInput(input: string): string {
  // Remove PostgREST operators: , . ( ) *
  return input.replace(/[,.()*]/g, "").trim();
}
