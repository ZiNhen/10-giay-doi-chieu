import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CircleHelp, ClipboardList, House, Layers, ScanLine, ShieldCheck, Sparkles, Timer, WifiOff } from 'lucide-react';
import { QuizProvider } from './quiz-context';
import { QuizPage, ResultPage } from './Quiz';
import { Assistant } from './Assistant';
import { Learn, Survey } from './Pages';
const nav = [
  { to: '/', name: 'Home', icon: House }, { to: '/learn', name: 'Học', icon: BookOpen },
  { to: '/quiz', name: 'Quiz', icon: Layers }, { to: '/assistant', name: 'AI', icon: Sparkles },
  { to: '/survey', name: 'Khảo sát', icon: ClipboardList },
];
export function SkillCards() {
  const cards = [
    { to: '/quiz?level=basic', title: 'Cơ bản', detail: 'Bắt đầu từ nguồn tin', className: 'blue', icon: Layers, number: '01' },
    { to: '/quiz?level=intermediate', title: 'Trung bình', detail: 'Nhìn rõ hơn bối cảnh', className: 'teal', icon: ScanLine, number: '02' },
    { to: '/quiz?level=advanced', title: 'Nâng cao', detail: 'Đọc sâu, nghĩ độc lập', className: 'orange', icon: ShieldCheck, number: '03' },
    { to: '/assistant', title: 'Trợ lý AI', detail: 'Tìm hiểu trước khi hỏi', className: 'yellow', icon: Sparkles, number: 'AI' },
  ];
  return <div className="skill-grid">{cards.map(c => <Link className={`skill-card ${c.className}`} to={c.to} key={c.to}><div className="card-top"><span>{c.number}</span><ArrowRight size={20} /></div><c.icon size={34} strokeWidth={1.5} /><div><h3>{c.title}</h3><p>{c.detail}</p></div></Link>)}</div>;
}
function Home() {
  return <>
    <div className="page-intro"><p className="eyebrow">MỖI LẦN CHIA SẺ, MỘT LẦN CÓ TRÁCH NHIỆM</p><h1>Một nhịp dừng.<br className="mobile-break" /> Một góc nhìn mới.</h1></div>
    <div className="hero-grid"><section className="hero"><div className="hero-copy"><span className="pill">10 GIÂY ĐỐI CHIẾU</span><h2>Đừng vội tin.<br /><span>Hãy đối chiếu.</span></h2><p>Giữa dòng thông tin mỗi ngày, dành một nhịp để kiểm tra nguồn, hiểu bối cảnh và tự tin hơn trước khi chia sẻ.</p><Link to="/quiz" className="button primary">Bắt đầu Quiz <ArrowRight size={19} /></Link><small>Một lời nhắc dừng lại, không phải cam kết xác minh trong 10 giây.</small></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="timer-disc"><Timer size={34} /><b>10<span>giây</span></b><div className="timer-dots">• • •</div></div><div className="art-badge"><ShieldCheck size={25} /></div></div></section>
    <section className="panel steps"><p className="eyebrow">MỘT THÓI QUEN NHỎ</p><h2>Trước khi nhấn<br />“Chia sẻ”</h2><ol><li><span className="step-number orange-soft">01</span><div><strong>Dừng lại</strong><p>Đừng để cảm xúc quyết định.</p></div></li><li><span className="step-number blue-soft">02</span><div><strong>Kiểm tra nguồn</strong><p>Tìm bản gốc và thời điểm.</p></div></li><li><span className="step-number teal-soft">03</span><div><strong>Đối chiếu</strong><p>Đọc thêm bằng chứng độc lập.</p></div></li></ol><Link to="/learn" className="text-link">Tìm hiểu cách thực hiện <ArrowRight size={17} /></Link></section></div>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">HỌC TỪ NHỮNG TÌNH HUỐNG NHỎ</p><h2>Khám phá kỹ năng</h2></div><span className="subtle">Chọn điểm bắt đầu của bạn</span></div><SkillCards /></section>
    <section className="panel mobile-steps"><h2>Trước khi nhấn “Chia sẻ”</h2><ol><li><span className="step-number orange-soft">01</span><div><strong>Dừng lại</strong><p>Đừng để cảm xúc quyết định.</p></div></li><li><span className="step-number blue-soft">02</span><div><strong>Kiểm tra nguồn</strong><p>Tìm bản gốc và thời điểm.</p></div></li><li><span className="step-number teal-soft">03</span><div><strong>Đối chiếu</strong><p>Đọc thêm bằng chứng độc lập.</p></div></li></ol></section>
    <section className="practice-banner"><div className="banner-icon"><BookOpen size={30} /></div><div><h2>Không cần biết hết. Hãy biết cách kiểm tra.</h2><p>Những hướng dẫn ngắn để đọc nguồn, hiểu hình ảnh và nhận ra giới hạn của AI.</p></div><Link className="button secondary" to="/learn">Vào góc kiến thức <ArrowRight size={18} /></Link></section>
  </>;
}
function RouteEffects() {
  const { pathname, hash } = useLocation();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const names: Record<string, string> = { '/': 'Khám phá', '/learn': 'Góc kiến thức', '/quiz': 'Luyện tập Quiz', '/quiz/result': 'Kết quả Quiz', '/assistant': 'Trợ lý AI', '/survey': 'Khảo sát' };
    document.title = `${names[pathname] ?? 'Không tìm thấy trang'} · 10 Giây Đối Chiếu`;
    const focusContent = previous.current !== null && previous.current !== pathname + hash;
    previous.current = pathname + hash;
    const id = requestAnimationFrame(() => {
      let anchor = hash.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch { /* Invalid shared anchor falls back safely. */ }
      const target = hash ? document.getElementById(anchor) : document.getElementById('main');
      if (target && (hash || focusContent)) target.focus({ preventScroll: true });
      if (hash && target) target.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);
  return null;
}
export default function App() {
  const location = useLocation();
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    addEventListener('online', update); addEventListener('offline', update);
    return () => { removeEventListener('online', update); removeEventListener('offline', update); };
  }, []);
  return <QuizProvider><RouteEffects /><a className="skip-link" href="#main">Bỏ qua đến nội dung chính</a><div className="app-shell"><aside className="sidebar"><Link to="/" className="brand"><span className="brand-mark">10<span>″</span></span><span>Giây<br /><b>Đối Chiếu</b></span></Link><p className="sidebar-caption">DỪNG LẠI ĐỂ HIỂU HƠN</p><nav aria-label="Điều hướng chính">{nav.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={n.to === '/quiz' ? 'quiz-nav' : ''}><span className="nav-icon"><n.icon size={23} strokeWidth={1.7} aria-hidden="true" /></span><span>{n.name}</span></NavLink>)}</nav><div className="sidebar-note"><ShieldCheck size={26} /><p>Chia sẻ có hiểu biết.<br />Kết nối có trách nhiệm.</p><span>Không tài khoản · Không quảng cáo</span></div></aside>
    <div className="main-shell"><header className="topbar"><Link to="/" className="mobile-brand"><span className="brand-mark">10<span>″</span></span><b>Giây Đối Chiếu</b></Link><span className="desktop-greeting">Chào bạn, cùng nhìn kỹ hơn nhé.</span><span className="topbar-note"><span className="status-dot" /> Không gian học kỹ năng</span></header>
      <main id="main" tabIndex={-1}>{offline && <div className="notice" role="status"><WifiOff size={21} />Bạn đang ngoại tuyến. Nội dung đã tải vẫn đọc được; liên kết ngoài cần kết nối mạng.</div>}<Routes><Route path="/" element={<Home />} /><Route path="/learn" element={<Learn />} /><Route path="/quiz" element={<QuizPage key={location.search} />} /><Route path="/quiz/result" element={<ResultPage />} /><Route path="/assistant" element={<Assistant />} /><Route path="/survey" element={<Survey />} /><Route path="*" element={<section className="panel empty"><CircleHelp size={48} /><p className="eyebrow">404 · LẠC ĐƯỜNG MỘT CHÚT</p><h1>Trang này không tồn tại</h1><p>Hãy trở về và chọn một điều mới để khám phá.</p><Link to="/" className="button primary">Về Home <ArrowRight size={18} /></Link></section>} /></Routes></main>
      <footer><span><b>10 Giây Đối Chiếu</b> · Dừng lại. Kiểm tra. Đối chiếu.</span><span>Số liệu tham gia: <b>Chưa đo</b></span></footer>
    </div></div></QuizProvider>;
}
