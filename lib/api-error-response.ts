import { NextResponse } from "next/server";
import { isDurableStorageError } from "@/lib/durable-storage";

export function jsonErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400
) {
  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : fallbackMessage
    },
    {
      status: isDurableStorageError(error) ? 503 : fallbackStatus
    }
  );
}
