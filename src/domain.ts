export const levels = ['basic', 'intermediate', 'advanced'] as const;
export type Level = typeof levels[number];
export const levelNames: Record<Level, string> = { basic: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
export const skillIds = ['source-checking', 'image-context', 'fact-vs-inference', 'cross-checking', 'ai-uncertainty'] as const;
export type Skill = typeof skillIds[number];
export interface Source { title: string; url: string; publisher?: string; publishedAt?: string; checkedAt?: string }
export interface Question {
  id: string; level: Level; question: string; options: { id: string; text: string }[];
  correctOptionId: string; explanation: string; skillTag: Skill; sources: Source[];
  version: string; isDemo: boolean; isSyntheticScenario: boolean;
}
export interface Dataset { datasetVersion: string; approvedForProduction: boolean; questions: Question[] }
export interface Attempt {
  schemaVersion: 1; attemptId: string; datasetVersion: string; level: Level;
  answers: { questionId: string; selectedOptionId: string; submittedAt: string }[];
  startedAt: string; completedAt?: string;
}
export function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function nonempty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
export function safeUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export function isSource(value: unknown): value is Source {
  return record(value) && nonempty(value.title) && safeUrl(value.url)
    && ['publisher', 'publishedAt', 'checkedAt'].every(k => value[k] === undefined || nonempty(value[k]));
}
export function isLevel(value: unknown): value is Level { return levels.includes(value as Level); }
export function validateDataset(value: unknown, official = true): value is Dataset {
  if (!record(value) || !nonempty(value.datasetVersion) || typeof value.approvedForProduction !== 'boolean' || !Array.isArray(value.questions)) return false;
  if (official && (value.approvedForProduction !== true || value.questions.length !== 15)) return false;
  if (!official && value.approvedForProduction !== false) return false;
  const ids = new Set<string>();
  for (const q of value.questions) {
    if (!record(q) || !nonempty(q.id) || ids.has(q.id) || !isLevel(q.level) || !nonempty(q.question)
      || !nonempty(q.explanation) || !nonempty(q.version) || !skillIds.includes(q.skillTag as Skill)
      || typeof q.isSyntheticScenario !== 'boolean' || q.isDemo !== !official
      || !Array.isArray(q.options) || q.options.length < 2 || !Array.isArray(q.sources)) return false;
    const optionIds = new Set<string>();
    const optionTexts = new Set<string>();
    for (const o of q.options) {
      if (!record(o) || !nonempty(o.id) || !nonempty(o.text) || optionIds.has(o.id) || optionTexts.has(o.text.trim())) return false;
      optionIds.add(o.id); optionTexts.add(o.text.trim());
    }
    if (!optionIds.has(q.correctOptionId as string) || !q.sources.every(isSource) || (!q.isSyntheticScenario && q.sources.length === 0)) return false;
    ids.add(q.id);
  }
  const questions = value.questions as Question[];
  return official ? levels.every(l => questions.filter(q => q.level === l).length === 5) : questions.length > 0;
}
export function questionsFor(data: Dataset, level: Level) { return data.questions.filter(q => q.level === level); }
export function newAttempt(data: Dataset, level: Level): Attempt {
  return { schemaVersion: 1, attemptId: crypto.randomUUID(), datasetVersion: data.datasetVersion, level, answers: [], startedAt: new Date().toISOString() };
}
const validTime = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
export function validateAttempt(value: unknown, data: Dataset): value is Attempt {
  if (!record(value) || value.schemaVersion !== 1 || !nonempty(value.attemptId) || value.datasetVersion !== data.datasetVersion
    || !isLevel(value.level) || !validTime(value.startedAt) || !Array.isArray(value.answers)) return false;
  const qs = questionsFor(data, value.level);
  if (!qs.length || value.answers.length > qs.length) return false;
  let lastTime = Date.parse(value.startedAt);
  for (let i = 0; i < value.answers.length; i++) {
    const a = value.answers[i];
    if (!record(a) || a.questionId !== qs[i].id || !qs[i].options.some(o => o.id === a.selectedOptionId) || !validTime(a.submittedAt) || Date.parse(a.submittedAt) < lastTime) return false;
    lastTime = Date.parse(a.submittedAt);
  }
  if (value.answers.length === qs.length) return validTime(value.completedAt) && Date.parse(value.completedAt) >= lastTime;
  return value.completedAt === undefined;
}
export function submitAnswer(attempt: Attempt, data: Dataset, questionId: string, selectedOptionId: string): Attempt {
  if (!validateAttempt(attempt, data) || attempt.completedAt) return attempt;
  const question = questionsFor(data, attempt.level)[attempt.answers.length];
  if (question.id !== questionId || !question.options.some(o => o.id === selectedOptionId)) return attempt;
  const now = new Date(Math.max(Date.now(), Date.parse(attempt.answers.at(-1)?.submittedAt ?? attempt.startedAt))).toISOString();
  const answers = [...attempt.answers, { questionId, selectedOptionId, submittedAt: now }];
  return { ...attempt, answers, ...(answers.length === questionsFor(data, attempt.level).length ? { completedAt: now } : {}) };
}
export function score(attempt: Attempt, data: Dataset) {
  return questionsFor(data, attempt.level).filter(q => attempt.answers.some(a => a.questionId === q.id && a.selectedOptionId === q.correctOptionId)).length;
}
export const storageKey = 'doi-chieu.attempt.v1';
export function restoreAttempt(data: Dataset): Attempt | null {
  try { const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); return validateAttempt(value, data) ? value : null; } catch { return null; }
}
export interface SurveyConfig { url: string | null; enabled: boolean; start: string; end: string }
export type SurveyStatus = 'pending' | 'open' | 'closed' | 'error';
export function surveyStatus(config: SurveyConfig, now = new Date()): SurveyStatus {
  const dateValid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if (!dateValid(config.start) || !dateValid(config.end) || config.end < config.start) return 'error';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (today > config.end) return 'closed';
  if (config.url && (!safeUrl(config.url) || !['forms.gle', 'docs.google.com'].includes(new URL(config.url).hostname)
    || (new URL(config.url).hostname === 'docs.google.com' && !new URL(config.url).pathname.startsWith('/forms/')))) return 'error';
  if (!config.enabled || !config.url || today < config.start) return 'pending';
  return 'open';
}
