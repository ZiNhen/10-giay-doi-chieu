type Source = { title: string; url: string; publisher: string; passage: string; checkedAt?: string };
const model = 'gemini-2.5-flash';
const maxSources = 5;

function sources(): Source[] {
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

function relevantSources(query: string, items: Source[]) {
  const terms = query.toLocaleLowerCase('vi').split(/\W+/).filter(term => term.length > 2);
  return items.map(source => ({ source, score: terms.filter(term => `${source.title} ${source.passage}`.toLocaleLowerCase('vi').includes(term)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, maxSources).map(item => item.source);
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
  const context = relevantSources(message, sources());
  if (!context.length) return Response.json({
    status: 'insufficient_evidence', answer: 'Chưa tìm thấy đoạn thông tin phù hợp trong kho nguồn đã duyệt.',
    citations: [], confidence: 10, confidenceLabel: 'low',
    warning: 'Không nên xem hoặc lan truyền khẳng định này như thông tin đã được xác thực. Hãy cung cấp nguồn chính thức hoặc kiểm tra trực tiếp trên cổng thông tin chính phủ.'
  });
  const prompt = `Bạn là trợ lý kiểm chứng thông tin. Chỉ dùng CONTEXT, không dùng kiến thức bên ngoài. Nếu CONTEXT không đủ, nói rõ chưa đủ bằng chứng. Trả về đúng JSON với các khóa: status (answered|partial|insufficient_evidence), answer (tiếng Việt, chèn [S1]...), confidence (0-100, mức độ khớp với nguồn chứ không phải xác suất sự thật), confidenceLabel (high|medium|low), warning (cảnh báo ngắn nếu chưa đủ bằng chứng), citationIds (mảng S1...). Không bịa URL, ngày tháng hay trích dẫn.\n\nQUESTION:\n${message}\n\nCONTEXT:\n${context.map((source, index) => `[S${index + 1}] ${source.title} | ${source.url}\n${source.passage}`).join('\n\n')}`;
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
