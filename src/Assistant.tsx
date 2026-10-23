import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, RotateCcw, Send, Sparkles, Square, FileSearch } from 'lucide-react';
import { Sources } from './components';
import { askAssistant, disabledConfig, messages, validConfig, type AssistantConfig, type AssistantResponse } from './assistant-api';
import { useAuth } from './auth';
const prompts = ['Làm sao kiểm tra nguồn của một bài đăng?', 'Tôi nên kiểm tra bối cảnh ảnh như thế nào?', 'Khi AI trả lời thiếu nguồn, tôi nên làm gì?'];
interface Turn { id: number; prompt: string; response?: AssistantResponse }
interface SavedChat { id: string; title: string; turns: Turn[]; updatedAt: number }
function readChatHistory(key: string): SavedChat[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is SavedChat => Boolean(item && typeof item === 'object' && Array.isArray((item as SavedChat).turns))) : [];
  } catch { return []; }
}
export function Assistant({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const chatHistoryKey = `10s-assistant-chat-history:${user?.id ?? 'guest'}`;
  const [config, setConfig] = useState<AssistantConfig>(disabledConfig);
  const [checking, setChecking] = useState(true);
  const [revision, setRevision] = useState(0);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>(() => {
    const current = readChatHistory(chatHistoryKey).find(chat => chat.id === 'current');
    return current?.turns ?? [];
  });
  const [history, setHistory] = useState<SavedChat[]>(() => readChatHistory(chatHistoryKey).filter(chat => chat.id !== 'current').sort((a, b) => b.updatedAt - a.updatedAt));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const active = useRef<AbortController | null>(null);
  const lastSent = useRef(0);
  const composer = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const saved = readChatHistory(chatHistoryKey);
    setTurns(saved.find(chat => chat.id === 'current')?.turns ?? []);
    setHistory(saved.filter(chat => chat.id !== 'current').sort((a, b) => b.updatedAt - a.updatedAt));
  }, [chatHistoryKey]);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    setChecking(true);
    fetch('/data/assistant.json', { cache: 'no-cache', signal: controller.signal }).then(r => r.ok ? r.json() : null).then(value => { if (!disposed) setConfig(validConfig(value) ? value : disabledConfig); }).catch(() => { if (!disposed) setConfig(disabledConfig); }).finally(() => { clearTimeout(timer); if (!disposed) setChecking(false); });
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [revision]);
  useEffect(() => () => { active.current?.abort(); document.documentElement.classList.remove('composer-focused'); }, []);
  useEffect(() => { if (turns.length) end.current?.scrollIntoView({ block: 'nearest' }); }, [turns, busy]);
  useEffect(() => {
    if (!turns.length) return;
    try {
      const saved = readChatHistory(chatHistoryKey).filter(chat => chat.id !== 'current');
      localStorage.setItem(chatHistoryKey, JSON.stringify([{ id: 'current', title: turns[0].prompt, turns, updatedAt: Date.now() }, ...saved].slice(0, 21)));
    } catch { /* Chat remains available for the current page even when storage is unavailable. */ }
  }, [turns]);
  const archiveAndReset = () => {
    active.current?.abort(); active.current = null; setBusy(false);
    if (turns.length) {
      const archived: SavedChat = { id: `${Date.now()}`, title: turns[0].prompt, turns, updatedAt: Date.now() };
      const next = [archived, ...history.filter(chat => chat.id !== archived.id)].slice(0, 20);
      setHistory(next);
      try { localStorage.setItem(chatHistoryKey, JSON.stringify(next)); } catch { /* Keep the reset action usable without storage. */ }
    }
    setTurns([]); setInput(''); setNotice('Đã bắt đầu cuộc trò chuyện mới. Lịch sử vẫn được giữ lại bên phải.'); lastSent.current = 0;
  };
  const available = !checking && validConfig(config);
  const send = async (prompt: string) => {
    if (active.current || !available || !prompt.trim() || prompt.length > 1200) return;
    if (Date.now() - lastSent.current < 5000) { setNotice('Vui lòng đợi 5 giây giữa các lần gửi.'); return; }
    lastSent.current = Date.now();
    const controller = new AbortController(); active.current = controller;
    const id = Date.now(); setTurns(t => [...t.slice(-19), { id, prompt }]); setInput(''); setBusy(true); setNotice('');
    try { const response = await askAssistant(prompt, config, controller.signal); if (!controller.signal.aborted) setTurns(t => t.map(turn => turn.id === id ? { ...turn, response } : turn)); }
    catch { if (controller.signal.aborted) { setTurns(t => t.filter(turn => turn.id !== id)); setNotice('Đã hủy yêu cầu.'); } }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  };
  const latest = [...turns].reverse().find(t => t.response?.citations.length)?.response;
  return <div className={embedded ? 'assistant-embedded' : ''}>{!embedded && <><p className="eyebrow">HỎI CÓ CƠ SỞ · ĐỌC CÓ ĐỐI CHIẾU</p><div className="section-heading"><div><h1>Trợ lý AI</h1><p className="lead">Một góc hỗ trợ kiểm tra, không thay bạn kết luận.</p></div><button className="button secondary reset-chat" onClick={archiveAndReset}><RotateCcw size={17} /> Bắt đầu lại</button></div></>}
    <div className="chat-layout"><section className="panel chat-panel" aria-label="Cuộc trò chuyện"><div className="chat-heading"><span className="level-icon yellow"><Sparkles size={24} /></span><div><b>Cùng tìm hiểu, cùng đối chiếu</b><p>{checking ? 'Đang kiểm tra khả năng kết nối…' : available ? 'Đã cấu hình dịch vụ · Luôn kiểm tra nguồn' : 'Chưa kết nối dịch vụ AI'}</p></div></div>
      <div className="chat-content"><div className="welcome"><span className="welcome-icon"><FileSearch size={39} strokeWidth={1.4} /></span><h2>Bắt đầu từ một câu hỏi tốt</h2><p>Hỏi về nguồn, bối cảnh hoặc bằng chứng.<br />Không gửi thông tin cá nhân hay dữ liệu nhạy cảm.</p><div className="prompt-list">{prompts.map(p => <button key={p} onClick={() => { setInput(p); composer.current?.focus(); }}>{p}<ArrowRight size={16} /></button>)}</div></div>
      {!checking && !available && <div className="notice"><div><strong>{messages.unavailable.title}</strong><p>{messages.unavailable.detail}</p><div className="actions"><Link className="text-link" to="/learn">Đọc hướng dẫn <ArrowRight size={16} /></Link><button className="text-button" onClick={() => setRevision(r => r + 1)}>Kiểm tra lại kết nối</button></div></div></div>}
      <div aria-live="polite" aria-relevant="additions text">{turns.map(t => <div className="chat-turn" key={t.id}><div className="user-message"><b>Bạn</b><p>{t.prompt}</p></div>{t.response && <div className="assistant-message"><b>Trợ lý AI · {messages[t.response.status].title}</b>{t.response.answer && <p>{t.response.answer.split(/(\[[a-zA-Z0-9_-]+\])/g).map((part, i) => { const citation = t.response!.citations.find(c => `[${c.id}]` === part); return citation ? <a key={i} href={citation.url} target="_blank" rel="noopener noreferrer" aria-label={`${citation.title} (mở thẻ mới)`}>{part}</a> : part; })}</p>}{t.response.confidence !== undefined && <p className="evidence-score"><strong>Mức độ đối chiếu: {t.response.confidence}%</strong>{t.response.confidenceLabel === 'low' && ' · Chưa đủ cơ sở'}</p>}{t.response.warning && <div className="notice warning"><strong>Cẩn thận trước khi chia sẻ</strong><p>{t.response.warning}</p></div>}<p className="subtle">{messages[t.response.status].detail}</p>{t.response.limitations && <p>{t.response.limitations}</p>}{t.response.citations.length > 0 && <details className="inline-evidence"><summary>Nguồn đối chiếu ({t.response.citations.length})</summary><Sources sources={t.response.citations} /></details>}{['error', 'offline', 'timeout', 'rate_limited', 'unavailable'].includes(t.response.status) && <button className="text-button" disabled={busy} onClick={() => void send(t.prompt)}>Thử gửi lại</button>}</div>}</div>)}</div>{busy && <p role="status">Đang chờ phản hồi từ dịch vụ…</p>}<div ref={end} /></div>
      <form className="composer" onSubmit={e => { e.preventDefault(); void send(input); }}><label htmlFor="chat-input">Câu hỏi của bạn</label><textarea id="chat-input" ref={composer} value={input} maxLength={1200} rows={3} placeholder="Bạn muốn kiểm tra điều gì?" aria-describedby="composer-help" onChange={e => setInput(e.target.value)} onFocus={() => document.documentElement.classList.add('composer-focused')} onBlur={() => document.documentElement.classList.remove('composer-focused')} /><div className="composer-actions"><small id="composer-help">{input.length}/1200 · {available ? 'Không lưu nội dung trên trình duyệt' : 'Chưa gửi được khi AI chưa kết nối'}</small>{busy ? <button type="button" className="button secondary" onClick={() => active.current?.abort()}><Square size={16} /> Hủy</button> : <button type="submit" className="button primary" disabled={!available || !input.trim()}><Send size={16} /> Gửi</button>}</div>{notice && <p role="status">{notice}</p>}</form>
    </section><aside className="panel evidence"><FileSearch size={27} /><h2>Nguồn đối chiếu</h2>{latest ? <><Sources sources={latest.citations} /><p className="subtle">Nguồn của câu trả lời có dẫn chứng gần nhất. Xem từng câu trả lời để đối chiếu đúng ngữ cảnh.</p></> : <><p>Chưa có nguồn được truy xuất.</p><p className="subtle">Khi dịch vụ hoạt động, tài liệu hỗ trợ câu trả lời sẽ xuất hiện tại đây. Không có nguồn không đồng nghĩa thông tin sai.</p></>}<Link className="text-link" to="/learn#ai-uncertainty"><BookOpen size={18} /> Hiểu giới hạn của AI</Link>{history.length > 0 && <div className="chat-history"><h3>Chat cũ</h3>{history.map(chat => <button key={chat.id} className="history-item" onClick={() => setTurns(chat.turns)}>{chat.title}</button>)}</div>}</aside></div></div>;
}
