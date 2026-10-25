# Vai trò và phân quyền

## 1. Hai tầng quyền

### Tầng nền tảng

- `user`: mọi tài khoản thông thường.
- `platform_admin`: quản trị taxonomy, xử lý báo cáo và vận hành. Chỉ cấp thủ công bằng migration/admin backend.

### Tầng lớp học

- `owner`
- `teacher`
- `teaching_assistant`
- `student`

Không lưu `teacher` hoặc `student` như một quyền toàn cục bất biến. Một người có thể mang vai trò khác nhau ở các lớp khác nhau.

## 2. Ma trận quyền lớp

| Hành động | Owner | Teacher | Trợ giảng | Student |
|---|:---:|:---:|:---:|:---:|
| Xem nội dung được xuất bản | ✓ | ✓ | ✓ | ✓ nếu được giao |
| Tạo/sửa nội dung | ✓ | ✓ | Theo capability | — |
| Tạo/chấm bài tập | ✓ | ✓ | Theo capability | — |
| Làm/nộp bài | — | — | — | ✓ |
| Xem mọi bài nộp/điểm | ✓ | ✓ | Nếu có `grade_submissions` | — |
| Xem điểm bản thân | — | — | — | ✓ |
| Quản lý học sinh | ✓ | ✓ | Nếu có `manage_members` | — |
| Đổi vai trò giáo viên/trợ giảng | ✓ | — | — | — |
| Chuyển quyền sở hữu | ✓ | — | — | — |
| Sửa cài đặt/xóa/lưu trữ lớp | ✓ | Giới hạn | — | — |
| Xem audit log | ✓ | Giới hạn hoạt động dạy | — | — |

## 3. Quy tắc quyền quan trọng

- Owner duy nhất tại một thời điểm; chuyển owner là transaction nguyên tử.
- Owner không thể rời lớp khi chưa chuyển quyền.
- Teacher không thể nâng chính mình hoặc người khác thành owner.
- Trợ giảng mặc định không có capability; owner/teacher được phép mới bật từng quyền.
- Học sinh không thấy danh sách email/số điện thoại của thành viên khác.
- Thành viên `pending`, `rejected`, `removed` không được coi là thành viên hoạt động.
- UI ẩn hành động không đủ quyền nhưng server/RLS vẫn phải từ chối yêu cầu trực tiếp.

## 4. Nguyên tắc Supabase RLS

Mọi bảng chứa dữ liệu người dùng/lớp đều bật RLS. Dùng helper function `security definer` tối thiểu, cố định `search_path` và không trả dữ liệu nhạy cảm.

Các predicate chuẩn:

- `is_active_class_member(class_id)`
- `has_class_role(class_id, roles[])`
- `has_class_capability(class_id, capability)`
- `is_content_target(class_id, content_type, content_id, user_id)`

### Chính sách theo nhóm dữ liệu

| Dữ liệu | Đọc | Ghi |
|---|---|---|
| `profiles` | Bản thân; thông tin công khai tối thiểu trong lớp chung | Chỉ bản thân; cột đặc quyền bị chặn |
| `classes` | Thành viên active | Owner/teacher theo cột cho phép |
| `class_members` | Thành viên active thấy tên/vai trò giới hạn | Owner/teacher; user được tạo yêu cầu tham gia cho chính mình |
| `posts`, `lessons`, `resources` | Thành viên active và đúng target/thời điểm | Người có quyền nội dung |
| `assignments` | Như nội dung, nhưng không trả đáp án sớm | Người có quyền bài tập |
| `submissions` | Học sinh sở hữu hoặc người có quyền chấm | Học sinh sở hữu trong cửa sổ nộp; người chấm sửa phần chấm |
| `grades` | Học sinh sở hữu khi published; người chấm | Người có quyền chấm |
| `notifications` | Chỉ người nhận | Backend tạo; người nhận chỉ sửa `read_at` |
| `audit_logs` | Owner và phạm vi teacher được phép | Chỉ backend/trigger, không update/delete |

## 5. Ngăn lộ đáp án

Không để đáp án đúng trong cùng payload câu hỏi gửi cho học sinh. Có thể chọn một trong hai cách:

1. Bảng `question_keys` tách riêng và chỉ service-side grading function được đọc.
2. View/RPC dành cho học sinh chỉ trả trường an toàn.

Khuyến nghị dùng cả bảng tách riêng và RPC chấm bài. Service role không bao giờ xuất hiện ở client hoặc biến môi trường có tiền tố `NEXT_PUBLIC_`.

## 6. Storage authorization

- Bucket riêng tư: `class-files`, `submissions`, `material-files`.
- Bucket công khai duy nhất: avatar/ảnh bìa đã kiểm duyệt, nếu chấp nhận rủi ro public.
- Path chuẩn chứa UUID, không dùng email: `classes/{class_id}/{entity}/{entity_id}/{file_id}`.
- Bài nộp: `submissions/{assignment_id}/{student_id}/{attempt_id}/{file_id}`.
- Download qua signed URL ngắn hạn sau khi kiểm tra RLS/authorization.
- Chặn path traversal, MIME nguy hiểm, file quá quota; không phục vụ HTML/SVG upload theo kiểu inline.

## 7. Audit bắt buộc

Ghi actor, action, entity, entity_id, class_id, before/after tối thiểu và thời gian cho:

- Thay vai trò/capability, chuyển owner.
- Duyệt/xóa thành viên.
- Công bố/sửa/đóng bài tập sau khi đã có người nộp.
- Chấm/sửa/trả điểm.
- Tạo lại mã lớp, lưu trữ/xóa lớp.
- Thay file hoặc thay đổi phạm vi học liệu.
