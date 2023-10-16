export function _isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export function _errorToJSON(message: string): string {
  return JSON.stringify({
    error: message,
  });
}
