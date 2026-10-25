# Quyết định sản phẩm, rủi ro và điểm cần chốt

## 1. Các quyết định mặc định đã dùng trong plan

| Chủ đề | Quyết định mặc định | Lý do |
|---|---|---|
| Tài khoản | Email + mật khẩu, xác minh email | Phù hợp Supabase và giảm phụ thuộc SMS |
| Vai trò | Quyền theo từng lớp | Một người có thể vừa dạy vừa học |
| Tham gia lớp | Mã/link, mặc định cần duyệt | Giảm người lạ vào lớp |
| Lớp dữ liệu | Class là ranh giới tenant chính | Dễ hiểu và phù hợp RLS |
| Bài tập P0 | Tệp, tự luận, 5 loại câu hỏi | Đủ dạy học phổ biến mà chưa quá rộng |
| Điểm | Chấm nháp rồi giáo viên publish | Tránh lộ kết quả chưa kiểm tra |
| Học liệu | File gốc + tham chiếu tái sử dụng | Tiết kiệm Storage và giữ một nguồn |
| Video | Gắn link, không host video dài | Kiểm soát chi phí/egress |
| Xóa | Soft delete + retention | Giảm mất dữ liệu do thao tác nhầm |
| Thời gian | Lưu UTC, mặc định Asia/Bangkok | Nhất quán database và đúng bối cảnh sử dụng |
| Kiểm tra | Cloud/prod smoke, không test local | Theo yêu cầu của chủ dự án |

## 2. Các câu hỏi nên chốt trước khi code epic liên quan

Các câu dưới đây không chặn việc khởi tạo dự án nhưng sẽ ảnh hưởng chi tiết triển khai:

1. Người dùng đăng ký bằng email hay bắt buộc thêm số điện thoại? Nếu dùng SMS cần ngân sách/provider và chống abuse.
2. Hệ thống chỉ cho cá nhân tạo lớp hay cần tenant trường/trung tâm ngay từ đầu?
3. Bộ taxonomy cấp/khối/môn theo chương trình Việt Nam nào, có cần chương trình quốc tế/trung tâm ngoại ngữ?
4. Mỗi loại tài khoản/lớp được bao nhiêu dung lượng và bao nhiêu thành viên?
5. P0 có bắt buộc import đề từ Word/PDF không? Đây là một epic lớn, cần chuẩn đầu vào rõ.
6. Trắc nghiệm có cần chống gian lận, full-screen, camera hay random bank ở P0 không?
7. Công thức điểm theo quy định cụ thể nào? Có hệ số miệng/15 phút/giữa kỳ/cuối kỳ không?
8. Học sinh có được xem tên/danh sách bạn cùng lớp không?
9. Có cần nội dung công khai toàn nền tảng hay kho học liệu chỉ private/lớp?
10. Thời gian lưu bài nộp và dữ liệu sau khi người dùng xóa tài khoản là bao lâu?

## 3. Rủi ro chính và cách giảm

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| RLS sai làm lộ lớp/điểm/bài nộp | Rất cao | Policy nhỏ, helper chuẩn, thử chéo nhiều tài khoản production |
| Đáp án nằm trong payload client | Rất cao | Tách bảng key, RPC/server-side grading |
| Migration trực tiếp production | Cao | Additive migration, backup, feature flag, forward-fix |
| Upload/video làm vượt quota | Cao | Giới hạn file, link video, dashboard chi phí |
| Nộp bài mất/nhân đôi do mạng | Cao | Autosave, finalize transaction, idempotency, biên nhận |
| Chấm lại làm mất lịch sử | Cao | Version key, grade history, recalculation report |
| Scope phình thành mạng xã hội | Trung bình | Bám P0/P1; chỉ làm trao đổi gắn với nội dung dạy |
| Notification gây spam | Trung bình | Preference, digest, dedupe, outbox |
| Test trực tiếp trên prod ảnh hưởng user | Cao | Lớp test riêng, is_test, feature flag, triển khai nhỏ |

## 4. Những phần nên tránh trong bản đầu

- Import Word/PDF “tự hiểu đề” nếu chưa định nghĩa template đầu vào.
- Chống gian lận bằng camera/AI; phức tạp pháp lý, riêng tư và độ tin cậy.
- Chat realtime toàn hệ thống; moderation và notification sẽ làm lệch trọng tâm.
- Parent portal và quản trị trường nhiều tầng trước khi lớp học đơn lẻ ổn định.
- Tùy biến công thức điểm vô hạn; bắt đầu bằng mô hình đơn giản, có version.

## 5. Đề xuất chốt MVP

MVP hợp lý nhất là: tài khoản → lớp → thành viên/nhóm → bảng tin/lịch → bài giảng/tài liệu → bài tập hỗn hợp → nộp/chấm → bảng điểm → kho học liệu private/lớp → thông báo. Điểm danh, ngân hàng câu hỏi và analytics chuyển sang P1 vì chúng tạo nhiều giá trị nhưng không chặn vòng dạy-học-đánh giá cơ bản.
