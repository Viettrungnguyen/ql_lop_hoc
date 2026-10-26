# Deploy và kiểm tra trên production

## 1. Nguyên tắc

Theo yêu cầu, không cần test local. Build, migration và kiểm tra chức năng được thực hiện trên hạ tầng Vercel + Supabase. Vì production có dữ liệu thật, mọi lần phát hành phải nhỏ, có feature flag, backup và phương án forward-fix/rollback giao diện.

## 2. Thiết lập ban đầu

### Supabase

- Chọn region gần người dùng Việt Nam nhất có sẵn trong gói.
- Bật Auth email verification và cấu hình Site URL/Redirect URLs đúng domain Vercel.
- Tạo private buckets và policy trước khi cho upload.
- Áp migration theo version; seed chỉ taxonomy, không seed tài khoản/mật khẩu thật.
- Bật backup/PITR theo gói và ngân sách; ghi rõ thời gian lưu.
- Cấu hình SMTP production để email không phụ thuộc giới hạn mặc định.

### Vercel

- Liên kết repository, chọn framework Next.js.
- Cấu hình Production Environment Variables; đánh dấu secret chỉ server.
- Gắn domain, HTTPS và redirect `www`/non-`www` thống nhất.
- Bật Deployment Protection cho preview nếu preview dùng cùng Supabase production.
- Cấu hình Sentry/observability và cảnh báo lỗi.

## 3. Quy trình release

1. Merge thay đổi nhỏ, Vercel build preview để bắt lỗi compile/type/build trên cloud.
2. Nếu có migration, đọc SQL diff và phân loại additive/breaking.
3. Với migration rủi ro: tạo backup/checkpoint, chạy pre-check dữ liệu.
4. Áp migration tương thích ngược trước; chưa xóa/đổi tên cột app cũ đang dùng.
5. Deploy production với feature flag tắt hoặc chỉ cho admin/lớp thử nghiệm.
6. Chạy smoke checklist bằng tài khoản production test.
7. Mở flag dần và theo dõi lỗi, latency, Auth, Storage, job/email.
8. Khi ổn định mới dọn schema cũ trong release riêng.

## 4. Bộ dữ liệu kiểm tra production

Tạo rõ nhãn `PROD-SMOKE`:

- 01 tài khoản owner test.
- 01 teacher/trợ giảng test.
- 02 học sinh test thuộc hai nhóm khác nhau.
- 01 lớp active, 01 lớp archived.
- Tệp nhỏ vô hại cho từng loại được hỗ trợ.

Không dùng email thật của học sinh để kiểm tra. Không xóa cứng dữ liệu smoke ngay sau mỗi lần chạy; tái sử dụng để phát hiện lỗi hồi quy, và loại khỏi analytics bằng cờ `is_test` chỉ admin được sửa.

## 5. Smoke checklist production

### Auth và quyền

- [ ] Đăng ký → xác minh → onboarding → đăng nhập/đăng xuất.
- [ ] Quên mật khẩu và redirect đúng domain.
- [ ] Học sinh A không mở URL dữ liệu của học sinh B.
- [ ] Người ngoài lớp nhận 403/404 phù hợp ở cả UI và request trực tiếp.
- [ ] Trợ giảng chỉ thực hiện đúng capability được cấp.

### Lớp học

- [ ] Tạo lớp, vào bằng mã, pending, duyệt và từ chối.
- [ ] Tạo lại mã làm mã cũ mất hiệu lực.
- [ ] Tạo hai nhóm; nội dung nhóm A không hiện cho nhóm B.
- [ ] Lưu trữ lớp chuyển học sinh sang chỉ đọc.

### Nội dung và lịch

- [ ] Bài nháp/hẹn giờ không lộ sớm.
- [ ] Bảng tin, bình luận, khóa bình luận và ghim hoạt động.
- [ ] Đính kèm tối đa 10 tài liệu vào bài đăng; chỉnh sửa hiển thị nhãn và lưu trữ ẩn khỏi học sinh.
- [ ] Lịch hiển thị đúng ngày/giờ `Asia/Bangkok`; link và nhắc lịch đúng người.
- [ ] Chỉnh sửa/hủy buổi học gửi thông báo đúng lớp/nhóm và mở đúng buổi từ deep link.
- [ ] Bài giảng/tài liệu private tải qua signed URL, URL hết hạn không còn dùng được.

### Bài tập và điểm

- [ ] Tạo bài hỗn hợp, preview không chứa đáp án trong network payload.
- [ ] Autosave, nộp bài, retry không tạo trùng attempt.
- [ ] Quá hạn được xác định bằng thời gian server.
- [ ] Auto-grade đúng; giáo viên chấm tự luận và trả điểm.
- [ ] Điểm nháp/đáp án không hiện trước chính sách đã chọn.
- [ ] Sửa điểm tạo grade history/audit.

### Học liệu

- [ ] Upload, đổi tên, di chuyển thư mục, tìm/lọc.
- [ ] Gắn một tài liệu vào hai nội dung mà không nhân bản file.
- [ ] User khác không xem tài nguyên private bằng URL/API.
- [ ] Xóa tài nguyên đang được tham chiếu có cảnh báo và không làm vỡ nội dung.

## 6. Monitoring và cảnh báo

Theo dõi tối thiểu:

- Tỷ lệ lỗi 5xx, latency route/API, lỗi client quan trọng.
- Auth failures tăng bất thường, rate-limit hits.
- Database connections, CPU, disk/quota, slow queries.
- Storage dung lượng/egress và upload finalize lỗi.
- Outbox backlog, email failure, reminder job không chạy.
- Số bài nộp lỗi/duplicate và chênh lệch gradebook.

Cảnh báo phải đi tới một kênh người vận hành thực sự theo dõi. Log dùng request/correlation ID, không chứa dữ liệu học tập nhạy cảm.

## 7. Rollback và sự cố

- Frontend lỗi: rollback Vercel deployment gần nhất nếu schema vẫn tương thích.
- Migration additive lỗi: sửa tiến bằng migration mới; tránh down migration phá dữ liệu.
- Feature lỗi: tắt flag trước, sau đó điều tra.
- Rò quyền/file: tắt route/flag, rotate signed keys nếu cần, sửa policy, rà access log và thông báo theo quy định.
- Chấm điểm sai: khóa publish, lưu snapshot, chạy recalculation có dry-run/report, không ghi đè im lặng.
- Job/email lỗi: dừng worker, giữ outbox, sửa rồi retry idempotent.

## 8. Kiểm soát chi phí

- Dashboard theo dõi MAU Auth, database size, Storage/egress, invocation Vercel, email.
- Đặt quota upload theo user/lớp và chặn video lớn.
- Archive lớp cũ không đồng nghĩa xóa file; có chính sách retention rõ trước khi tự động dọn.
- Realtime chỉ dùng nơi có giá trị trực tiếp; polling/revalidation phù hợp cho dữ liệu không cần tức thời.
