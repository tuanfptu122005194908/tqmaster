import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FunctionsHttpError } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getExamScore(title: string): number {
  if (!title) return 0;
  const t = title.toUpperCase();

  // Match both 2-digit (SU26) and 4-digit (SU2026) year formats
  const termMatch = t.match(/(SU|SP|FA)\s*(\d{4}|\d{2})/);

  let yearScore = 0;
  let seasonScore = 0;

  if (termMatch) {
    const season = termMatch[1];
    let year = parseInt(termMatch[2], 10);
    // Normalize 4-digit → 2-digit for comparison (2026 → 26)
    if (year > 100) year = year % 100;

    // Chronological order within a year: SP(Jan-Apr)=1 < SU(May-Aug)=6 < FA(Sep-Dec)=9
    // Descending sort: SU26(266) > SP26(261) > FA25(259) > SU25(256) > SP25(251) > FA24(249)
    seasonScore = season === 'SU' ? 6 : season === 'FA' ? 9 : 1;
    yearScore   = year * 10;
  }

  // Exam type: RE (retake) > FE (final) > others — minor tiebreaker
  let typeScore = 0;
  if (t.includes('RE')) typeScore = 2;
  else if (t.includes('FE')) typeScore = 1;

  return yearScore + seasonScore + typeScore;
}

export function sortExams<T extends { title: string }>(exams: T[]): T[] {
  return [...exams].sort((a, b) => {
    const scoreA = getExamScore(a.title);
    const scoreB = getExamScore(b.title);
    if (scoreA !== scoreB) return scoreB - scoreA; // DESC: newest first
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
