import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FunctionsHttpError } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function parseFunctionError(data: any, error: any): Promise<string | null> {
  let errMsg = data?.error || error?.message || null;
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) {
        errMsg = typeof body.error === 'string' ? body.error : body.error.message || errMsg;
      } else if (body?.message) {
        errMsg = body.message;
      }
    } catch (e) {
      // ignore
    }
  }
  return errMsg;
}
