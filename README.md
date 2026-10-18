# 10 Giây Đối Chiếu

Website tiếng Việt giúp luyện thói quen dừng lại, kiểm tra nguồn và đối chiếu thông tin trước khi chia sẻ. Giao diện React + TypeScript + Vite, điều hướng nhiều trang, thanh dock trên điện thoại và sidebar trên desktop.

## Chạy trên máy

Khuyến nghị Node.js 24 LTS và npm.

```sh
git clone https://github.com/ZiNhen/10-giay-doi-chieu.git
cd 10-giay-doi-chieu
npm ci
npm run dev
```

Mở địa chỉ do Vite hiển thị, mặc định `http://127.0.0.1:5173`. Giữ terminal mở; nhấn `Ctrl+C` để dừng.

## Kiểm tra và build

```sh
npm run typecheck
npm run build
npm run preview
```

Build xuất ra `dist/`. Preview mặc định tại `http://127.0.0.1:4173`. Thư viện và font được cài bằng npm; font không phụ thuộc dịch vụ font bên ngoài khi chạy web. Không cần API key hay file `.env` cho phiên bản hiện tại.

## Các trang

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Trang chủ và các kỹ năng |
| `/learn` | Kiến thức cùng nguồn đọc thêm |
| `/quiz` | Chọn cấp độ, trả lời và xem giải thích |
| `/quiz/result` | Điểm thực tế, xem lại đáp án và gợi ý học |
| `/assistant` | Giao diện AI, hiện chưa kết nối dịch vụ |
| `/survey` | Khảo sát trước/sau, hiện chưa có link chính thức |

## Cấu hình và dữ liệu

- `src/data/quiz.demo.json`: đúng 3 câu mẫu giả định, 1 câu mỗi cấp độ. UI luôn ghi rõ minh họa, không đánh giá năng lực hay giả làm bộ câu hỏi chính thức.
- `public/data/quiz.official.json`: nơi thay bộ câu hỏi được nhóm KS phê duyệt. Runtime chỉ nhận đủ 15 câu, đúng 5 câu mỗi cấp độ, ID duy nhất, đáp án hợp lệ, giải thích, skillTag và nguồn HTTPS cho khẳng định thực tế. Xem kiểu `Dataset`/`Question` và kiểm tra `validateDataset` trong `src/domain.ts`. Tăng `datasetVersion` khi thay nội dung, thứ tự hay đáp án; không tự bật phê duyệt cho dữ liệu mẫu.
- `src/surveys.config.json`: URL Google Forms, cờ `enabled` và lịch mở/đóng. Chỉ bật sau khi nhóm khảo sát xác nhận. Mốc thời gian tính theo giờ Việt Nam, gồm cả ngày kết thúc. Khảo sát tách biệt với Quiz.
- `src/content.ts`: bài học và tài liệu đọc thêm; không phải kho nguồn AI đã duyệt.
- `public/data/assistant.json`: AI mặc định tắt. Chỉ bật sau khi có backend miễn phí được xác minh và kho nguồn được duyệt. Adapter yêu cầu cùng origin tại `/api/assistant`, `verifiedFreeThrough` hợp lệ xuyên suốt chiến dịch và `approvedSources`. Xem hợp đồng phản hồi trong `src/assistant-api.ts`; câu trả lời phải gắn `[citationId]` với nguồn có tiêu đề/URL khớp danh sách duyệt. Backend Gemini MVP nằm ở `api/assistant.ts`: cấu hình `GEMINI_API_KEY` và `ASSISTANT_SOURCES_JSON` trên Vercel/Netlify, không đưa khóa vào frontend. Mỗi nguồn cần `title`, `url`, `publisher` và `passage`; endpoint chỉ gửi các đoạn khớp câu hỏi cho Gemini, yêu cầu JSON có dẫn chứng và cảnh báo khi thiếu bằng chứng. Backend vẫn phải xác minh bằng chứng, giới hạn yêu cầu và bảo vệ dữ liệu; kiểm tra phía trình duyệt không thay thế các việc này.

### Bật Gemini MVP trên Vercel/Netlify

Tạo hai biến môi trường ở phần cấu hình project:

```text
GEMINI_API_KEY=...        # chỉ ở backend, không dùng VITE_
ASSISTANT_SOURCES_JSON=[{"title":"Tên tài liệu","url":"https://coquan.gov.vn/tai-lieu","publisher":"Cơ quan chính phủ","passage":"Đoạn nội dung đã kiểm tra từ tài liệu.","checkedAt":"2026-10-18"}]
```

`passage` phải là nội dung đã được nhóm duyệt và ghi rõ nguồn gốc; không nên đưa toàn bộ Internet vào kho nguồn. Sau khi deploy backend, cập nhật `public/data/assistant.json` với `enabled: true`, `endpoint: "/api/assistant"`, ngày `verifiedFreeThrough` còn hiệu lực và danh sách `approvedSources` khớp URL/tiêu đề trong kho. Nếu chưa có kho nguồn chính phủ được duyệt, giữ AI tắt để tránh tạo cảm giác xác thực giả.

Tiến độ Quiz được lưu trong `sessionStorage` của tab, điểm được tính từ các đáp án đã gửi. Không thu tên/email, không lưu nội dung chat và không có dịch vụ analytics; số liệu hiển thị “Chưa đo”. Không có bảo đảm chống sửa đáp án phía trình duyệt.

**Chưa sẵn sàng phát hành công khai:** còn thiếu nội dung Quiz được duyệt, link khảo sát, backend/kho nguồn AI miễn phí được kiểm chứng, kiểm tra điện thoại thật và quyền triển khai. Việc đưa mã lên GitHub không bật AI hay triển khai website. Không đặt khóa bí mật trong `src/`, JSON công khai hoặc biến `VITE_*`.

## Hosting và tài nguyên

SPA cần fallback đường dẫn về `index.html`. File `_redirects` đã có trong `public/` cho host hỗ trợ cú pháp này. Với Nginx, dùng `try_files $uri $uri/ /index.html;`. Backend `/api/assistant` trong tương lai phải được xử lý trước fallback. GitHub Pages thuần không đọc `_redirects`; chưa có cấu hình triển khai Pages trong repo này. Build hiện giả định ứng dụng chạy ở gốc domain.

Chỉ đưa `dist/` lên hosting sau khi được cho phép và hoàn thành các điều kiện phát hành. Sao lưu mã nguồn, lockfile và dữ liệu/biên bản phê duyệt; không sao lưu khóa bí mật vào Git.

Font Be Vietnam Pro và icon Lucide có thông báo giấy phép trong `public/licenses/`. Hình minh họa đồng hồ được tạo bằng CSS.

## Phạm vi repository

Repo giữ mã ứng dụng, dữ liệu cần chạy, cấu hình build, lockfile, giấy phép và hướng dẫn này. Tài liệu bàn giao, ảnh tham khảo, bộ nhớ Codex, `PROGRESS.md`, mã/cấu hình kiểm thử và báo cáo QA được giữ cục bộ, nằm trong `.gitignore` theo yêu cầu. Vì vậy bản clone không phụ thuộc những file đó và không cung cấp script test/lint. Các lệnh chính là `dev`, `typecheck`, `build`, `preview`.
