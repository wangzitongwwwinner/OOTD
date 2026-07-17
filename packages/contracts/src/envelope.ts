import { z } from 'zod';

import { errorCodeSchema, type ErrorCode } from './errors.ts';

const requestIdSchema = z.string().min(1);

export const apiSuccessSchema = z
  .object({
    data: z.unknown(),
    requestId: requestIdSchema,
  })
  .strict();

export const apiFailureSchema = z
  .object({
    error: z
      .object({
        code: errorCodeSchema,
        message: z.string().min(1),
        retryable: z.boolean(),
      })
      .strict(),
    requestId: requestIdSchema,
  })
  .strict();

export const apiEnvelopeSchema = z.union([
  apiSuccessSchema,
  apiFailureSchema,
]);

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}

export interface ApiFailure {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
  requestId: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export function success<T>(data: T, requestId: string): ApiSuccess<T> {
  return { data, requestId };
}

export function failure(
  code: ErrorCode,
  message: string,
  retryable: boolean,
  requestId: string,
): ApiFailure {
  return {
    error: { code, message, retryable },
    requestId,
  };
}
