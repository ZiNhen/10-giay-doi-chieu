import { supabase } from './auth';
import type { Attempt, Dataset, Level } from './domain';

export async function saveQuizResult(userId: string, attempt: Attempt, data: Dataset, correctAnswers: number) {
  if (!supabase) return { error: 'Supabase chưa được cấu hình.' };
  const questions = data.questions.filter(question => question.level === attempt.level);
  const totalQuestions = questions.length;
  const result = await supabase.from('quiz_attempts').upsert({
    user_id: userId,
    attempt_id: attempt.attemptId,
    dataset_version: attempt.datasetVersion,
    level: attempt.level as Level,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    score_percent: Math.round((correctAnswers / totalQuestions) * 100),
    answers: attempt.answers,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt
  }, { onConflict: 'user_id,attempt_id' });
  return { error: result.error?.message ?? null };
}
