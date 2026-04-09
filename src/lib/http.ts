import type { ApiErrorPayload, ApiSuccess } from "../types.js";
import type { Response } from "express";

export function ok<T>(res: Response, data: T, status = 200) {
  const payload: ApiSuccess<T> = { success: true, data };
  return res.status(status).json(payload);
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  requestId?: string,
) {
  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message,
      details,
      requestId: requestId ?? crypto.randomUUID(),
    },
  };
  return res.status(status).json(payload);
}
