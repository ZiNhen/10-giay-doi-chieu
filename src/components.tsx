import { ArrowUpRight, Info } from 'lucide-react';
import type { Source } from './domain';
import { useQuiz } from './quiz-context';
export function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return <ul className="sources">{sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (mở thẻ mới)</span></a><small>{s.publisher}{s.publishedAt && ` · ${s.publishedAt}`}{s.checkedAt && ` · Đã kiểm tra ${s.checkedAt}`}</small></li>)}</ul>;
}
export function DemoNotice() {
  const { data, dataError, retry, storageFailed } = useQuiz();
  return <>{!data.approvedForProduction && <div className="notice"><Info size={20} aria-hidden="true" /><div><strong>Chế độ minh họa — chưa có nội dung chính thức</strong><p>Mỗi cấp độ có 1 câu mẫu giả định. Đây không phải bài Quiz 5 câu hay kết quả đánh giá kỹ năng.</p>{dataError && <button className="text-button" onClick={retry}>Kiểm tra lại dữ liệu chính thức</button>}</div></div>}{storageFailed && <p role="status" className="notice">Trình duyệt không cho lưu tiến độ. Bạn vẫn có thể làm bài; tải lại trang sẽ mất tiến độ.</p>}</>;
}
export function Loading() { return <div className="panel empty" role="status">Đang tải dữ liệu…</div>; }
