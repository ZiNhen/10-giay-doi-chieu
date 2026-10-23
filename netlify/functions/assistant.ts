type Source = { title: string; url: string; publisher: string; passage: string; checkedAt?: string };
const model = 'gemini-2.5-flash';
const maxSources = 5;
const greetingPattern = /^(xin chào|chào|hello|hi|hey|alo|bạn ơi|yo)\b/i;

function configuredSources(): Source[] {
  try {
    const value: unknown = JSON.parse(process.env.ASSISTANT_SOURCES_JSON ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Source => {
      if (!item || typeof item !== 'object') return false;
      const source = item as Record<string, unknown>;
      try { return typeof source.title === 'string' && typeof source.url === 'string' && new URL(source.url).protocol === 'https:'
        && typeof source.publisher === 'string' && typeof source.passage === 'string' && source.passage.length > 20; } catch { return false; }
    });
  } catch { return []; }
}

async function sources(request: Request): Promise<Source[]> {
  const configured = configuredSources();
  try {
    const response = await fetch(new URL('/data/quiz.official.json', request.url), { cache: 'no-store' });
    if (!response.ok) return configured;
    const dataset = await response.json() as { sourceCatalog?: Source[]; questions?: { question?: string; explanation?: string; sources?: Omit<Source, 'passage'>[] }[] };
    const catalogSources = (dataset.sourceCatalog ?? []).filter(source => source.passage.length > 20);
    const quizSources = (dataset.questions ?? []).flatMap(question => (question.sources ?? []).map(source => ({
      ...source,
      passage: `${question.question ?? ''} ${question.explanation ?? ''}`
    })));
    const all = [...configured, ...catalogSources, ...quizSources];
    return all.filter((source, index) => all.findIndex(candidate => candidate.url === source.url) === index);
  } catch {
    return configured;
  }
}

function relevantSources(query: string, items: Source[]) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi');
  const terms = normalize(query).split(/[^a-z0-9]+/).filter(term => term.length > 2);
  return items.map(source => ({ source, score: terms.filter(term => normalize(`${source.title} ${source.passage}`).includes(term)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, maxSources).map(item => item.source);
}

function relatedSources(query: string, items: Source[]) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi');
  const terms = normalize(query).split(/[^a-z0-9]+/).filter(term => term.length > 2);
  return items.map(source => ({
    source,
    score: terms.filter(term => normalize(`${source.title} ${source.publisher}`).includes(term)).length
  })).sort((a, b) => b.score - a.score).slice(0, maxSources).map(item => item.source);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ status: 'error', answer: '', citations: [] }, { status: 405 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ status: 'unavailable', answer: '', citations: [] }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ status: 'error', answer: '', citations: [] }, { status: 400 }); }
  const message = body && typeof body === 'object' && typeof (body as Record<string, unknown>).message === 'string'
    ? ((body as Record<string, string>).message).trim() : '';
  if (!message || message.length > 1200) return Response.json({ status: 'error', answer: '', citations: [] }, { status: 400 });
  if (greetingPattern.test(message)) {
    return Response.json({
      status: 'greeting',
      answer: 'Xin chào! Tôi là trợ lý AI chuyên hỗ trợ đối chiếu thông tin trên mạng dựa trên các nguồn đã được đưa vào kho kiểm chứng. Bạn có thể hỏi tôi về nguồn gốc, bối cảnh, quy định hoặc cách kiểm tra một thông tin. Tôi sẽ cố gắng trả lời rõ ràng và luôn kèm dẫn chứng; nếu kho nguồn chưa đủ, tôi sẽ nói rõ để bạn không vội tin hoặc lan truyền.',
      citations: [],
      confidence: 100,
      confidenceLabel: 'high'
    });
  }
  const availableSources = await sources(request);
  const context = relevantSources(message, availableSources);
  if (!context.length) {
    const related = relatedSources(message, availableSources);
    const citations = related.map((source, index) => ({ ...source, id: `S${index + 1}` }));
    return Response.json({
      status: 'insufficient_evidence',
      answer: citations.length
        ? `Xin lỗi, tôi chưa thể xác minh câu hỏi này từ kho nguồn đã duyệt. Độ tin cậy hiện tại chỉ khoảng 10% vì chưa có bằng chứng trực tiếp. Bạn có thể mở các nguồn liên quan ${citations.map(source => `[${source.id}]`).join(', ')} để tự đối chiếu.`
        : 'Xin lỗi, tôi chưa thể xác minh câu hỏi này vì chưa tìm thấy bằng chứng trực tiếp trong kho nguồn đã duyệt. Độ tin cậy hiện tại chỉ khoảng 10%.',
      citations, confidence: 10, confidenceLabel: 'low',
      warning: 'Cảnh báo: Đây chưa phải thông tin đã được xác thực. Không nên tin chắc, đăng lại hoặc lan truyền cho người khác. Hãy cung cấp nguồn gốc hoặc kiểm tra trực tiếp với cơ quan có thẩm quyền.'
    });
  }
  const prompt = `Bạn là trợ lý kiểm chứng thông tin. Chỉ dùng CONTEXT, không dùng kiến thức bên ngoài. Nếu CONTEXT không đủ, xin lỗi và nói rõ chưa đủ bằng chứng; không đoán hoặc trình bày suy luận như sự thật. Luôn nhắc người dùng kiểm tra nguồn gốc khi câu trả lời chưa chắc chắn. Trả về đúng JSON với các khóa: status (answered|partial|insufficient_evidence), answer (tiếng Việt, chèn [S1]...), confidence (0-100, mức độ khớp với nguồn chứ không phải xác suất sự thật), confidenceLabel (high|medium|low), warning (cảnh báo ngắn nếu chưa đủ bằng chứng), citationIds (mảng S1...). Không bịa URL, ngày tháng hay trích dẫn.\n\nQUESTION:\n${message}\n\nCONTEXT:\n${context.map((source, index) => `[S${index + 1}] ${source.title} | ${source.url}\n${source.passage}`).join('\n\n')}`;
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
    });
  } catch { return Response.json({ status: 'error', answer: '', citations: [] }, { status: 502 }); }
  if (!response.ok) return Response.json({ status: response.status === 429 ? 'rate_limited' : 'error', answer: '', citations: [] }, { status: response.status === 429 ? 429 : 502 });
  try {
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const answer = JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
    const citations = context.map((source, index) => ({ ...source, id: `S${index + 1}` })).filter(source => Array.isArray(answer.citationIds) && answer.citationIds.includes(source.id));
    return Response.json({ ...answer, citations, warning: answer.warning || (answer.confidence < 70 ? 'Chưa đủ cơ sở để khẳng định. Không nên lan truyền khi chưa kiểm tra nguồn gốc.' : undefined) });
  } catch { return Response.json({ status: 'error', answer: '', citations: [] }, { status: 502 }); }
}
