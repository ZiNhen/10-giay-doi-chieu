import type { Skill, Source } from './domain';
export const references: Source[] = [
  { title: 'Media and Information Literacy', url: 'https://www.unesco.org/en/media-information-literacy', publisher: 'UNESCO', checkedAt: '2026-10-18' },
  { title: 'How to spot AI-generated images', url: 'https://fullfact.org/toolkit/how-to-spot-ai-images/', publisher: 'Full Fact · Grace Rahman', publishedAt: '2023-04-05', checkedAt: '2026-10-18' },
  { title: 'Getting started with the Misinformation Toolkit', url: 'https://fullfact.org/toolkit/getting-started-with-the-misinformation-toolkit/', publisher: 'Full Fact · Claire Milne', checkedAt: '2026-10-18' },
  { title: 'Generative Artificial Intelligence Profile · §2.2 Confabulation', url: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf', publisher: 'NIST · AI 600-1', publishedAt: '2024-07-26', checkedAt: '2026-10-18' },
];
export const lessons: { id: Skill; title: string; short: string; color: string; paragraphs: string[]; sources: Source[] }[] = [
  { id: 'source-checking', title: 'Tìm về nguồn gốc', short: 'Ai nói? Khi nào? Dựa vào đâu?', color: 'blue', paragraphs: [
    'Trước khi chia sẻ, mở nội dung gốc thay vì chỉ đọc ảnh chụp hoặc tiêu đề. Xác định tác giả, đơn vị công bố và thời điểm cập nhật.',
    'Tìm bằng chứng cho từng khẳng định. Một nguồn chính thức cũng cần được đọc trong bối cảnh; danh tiếng không thay thế bằng chứng.'
  ], sources: [references[2]] },
  { id: 'image-context', title: 'Đọc đúng bối cảnh ảnh', short: 'Ảnh thật có thể kể sai câu chuyện.', color: 'teal', paragraphs: [
    'Tìm bản đăng sớm hơn bằng tìm kiếm hình ảnh ngược. So sánh ngày, địa điểm và chú thích với bài đăng đang xem.',
    'Đối chiếu các góc chụp và nguồn khác. Một dấu hiệu bất thường chỉ là lý do để kiểm tra thêm, chưa đủ chứng minh ảnh giả.'
  ], sources: [references[1]] },
  { id: 'fact-vs-inference', title: 'Dữ kiện hay suy luận?', short: 'Tách điều được biết khỏi điều được đoán.', color: 'orange', paragraphs: [
    'Gạch ra dữ kiện có thể kiểm tra, rồi tách phần nhận xét hoặc kết luận của người viết. Hỏi: bằng chứng này thực sự hỗ trợ đến đâu?',
    'Bài tập giả định: một nhóm nhỏ chọn phương án A không có nghĩa tất cả mọi người đều chọn A. Cần biết cách chọn mẫu và giới hạn dữ liệu.'
  ], sources: [references[2]] },
  { id: 'cross-checking', title: 'Đối chiếu độc lập', short: 'Nhiều bài đăng chưa chắc là nhiều nguồn.', color: 'navy', paragraphs: [
    'Tìm thêm bằng chứng độc lập, thay vì đếm các bài đăng sao chép cùng một thông tin. Kiểm tra chúng có cùng dẫn về một nguồn ban đầu hay không.',
    'Ghi lại điều đã xác nhận và điều còn thiếu. Nếu các nguồn mâu thuẫn, giữ kết luận mở và tìm thêm bối cảnh trước khi chia sẻ.'
  ], sources: [references[2]] },
  { id: 'ai-uncertainty', title: 'Hiểu giới hạn của AI', short: 'Một câu trả lời tự tin vẫn cần kiểm tra.', color: 'yellow', paragraphs: [
    'Dùng câu trả lời AI như điểm bắt đầu cho việc kiểm tra. Mở từng tài liệu được dẫn và xem nó có thực sự hỗ trợ khẳng định hay không.',
    'Không tìm thấy bằng chứng không đồng nghĩa thông tin sai. Khi thiếu nguồn hoặc bối cảnh, hãy nói rõ chưa đủ cơ sở để kết luận.'
  ], sources: [references[3]] },
];
