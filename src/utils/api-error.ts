type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
};

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;

  const { error, message } = payload as ApiErrorPayload;
  if (typeof message === 'string' && message.trim()) return message;
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const errorMessage = (error as { message?: unknown }).message;
    if (typeof errorMessage === 'string' && errorMessage.trim()) return errorMessage;
  }

  return fallback;
}
