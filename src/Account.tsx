import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, UserPlus, X } from 'lucide-react';
import { useAuth } from './auth';

export function AccountButton() {
  const { user, configured, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const username = typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username : user?.email;
  if (user) return <div className="account-area"><span className="account-name">{username}</span><button className="account-button" onClick={() => void signOut()}><LogOut size={15} /> Đăng xuất</button></div>;
  return <><button className="account-button" onClick={() => setOpen(true)}><LogIn size={15} /> Đăng nhập</button>{open && <AccountDialog configured={configured} onClose={() => setOpen(false)} />}</>;
}

function AccountDialog({ configured, onClose }: { configured: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    if (mode === 'signup' && !username.trim()) { setMessage('Vui lòng nhập username.'); setBusy(false); return; }
    const result = mode === 'signup'
      ? await signUp(username, email, password)
      : { ...(await signIn(email, password)), needsConfirmation: false };
    setBusy(false);
    if (result.error) { setMessage(result.error); return; }
    setMessage(mode === 'signup' && result.needsConfirmation ? 'Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản.' : 'Đăng nhập thành công.');
    if (mode === 'signin' || !result.needsConfirmation) onClose();
  };
  return <div className="account-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title"><button className="icon-button account-close" aria-label="Đóng" onClick={onClose}><X size={18} /></button><div className="account-icon">{mode === 'signin' ? <LogIn size={22} /> : <UserPlus size={22} />}</div><h2 id="account-title">{mode === 'signin' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2><p className="subtle">{mode === 'signin' ? 'Đăng nhập để lưu trải nghiệm của bạn.' : 'Username giúp bạn nhận diện, email dùng để xác nhận tài khoản.'}</p>{!configured && <div className="notice warning">Website chưa được cấu hình Supabase.</div>}<form onSubmit={submit}><label>{mode === 'signup' && <>Username<input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required /></>}{mode === 'signup' && <span className="sr-only">Email</span>}<input aria-label="Email" type="email" placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /><input aria-label="Mật khẩu" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" minLength={6} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required /></label>{message && <p className="account-message" role="status">{message}</p>}<button className="button primary account-submit" disabled={busy || !configured}>{busy ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}</button></form><button className="text-button account-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button></section></div>;
}
