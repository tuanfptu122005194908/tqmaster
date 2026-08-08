import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FunctionsHttpError } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getExamScore(title: string): number {
  if (!title) return 0;
  const t = title.toUpperCase();
  let year = 0;
  let term = 0;
  let type = 0;

  const termMatch = t.match(/(SU|SP|FA)\s*(\d{2})/);
  if (termMatch) {
    term = termMatch[1] === 'FA' ? 3 : termMatch[1] === 'SU' ? 2 : 1;
    year = parseInt(termMatch[2], 10);
  }

  if (t.includes('RE')) {
    type = 2;
  } else if (t.includes('FE')) {
    type = 1;
  }

  return (year * 1000) + (term * 100) + (type * 10);
}

export function sortExams<T extends { title: string }>(exams: T[]): T[] {
  return exams.sort((a, b) => {
    const scoreA = getExamScore(a.title);
    const scoreB = getExamScore(b.title);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return (a.title || '').localeCompare(b.title || '');
  });
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
