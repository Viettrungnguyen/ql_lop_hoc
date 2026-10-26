# Tiến độ triển khai

## Giai đoạn 0 — nền tảng dự án

Trạng thái: **Hoàn thành mã nguồn, chờ cấu hình Supabase/Vercel production**.

Đã triển khai:

- Next.js App Router, TypeScript, Tailwind CSS và ESLint.
- Landing page responsive theo định hướng sản phẩm giảng dạy.
- Đăng ký, xác minh email, đăng nhập, callback và đăng xuất bằng Supabase Auth SSR.
- Dashboard được bảo vệ và các điểm vào cho lớp, lịch, bài tập, học liệu.
- Supabase client cho browser/server và cơ chế refresh session ở `proxy.ts`.
- Migration `profiles`, taxonomy cấp/khối/môn, audit log và private Storage buckets.
- RLS hồ sơ/taxonomy; giới hạn quyền update để client không sửa `platform_role`.
- Seed khối 1–12 và danh sách môn học cơ bản.
- Biến môi trường mẫu và cấu hình region Vercel Singapore.

Việc cần làm trên production trước khi chuyển sang Giai đoạn 1:

- [ ] Tạo/liên kết Supabase project.
- [ ] Chạy migration và seed.
- [ ] Cấu hình SMTP, Site URL và Redirect URLs.
- [ ] Khai báo biến môi trường trên Vercel.
- [ ] Deploy và chạy phần Auth trong smoke checklist production.

## Giai đoạn 1 — tài khoản và lớp học

Trạng thái: **Đã có nền tảng mã nguồn cần cho Giai đoạn 2, chờ smoke test production**.

Đã triển khai:

- Bảng `classes`, `class_members`, `groups`, `group_members` và RLS helper.
- Tạo lớp, tham gia bằng mã và duyệt/từ chối học sinh.
- Vai trò owner/teacher/teaching assistant/student và capability mở rộng.
- Tạo nhóm học tập và phân phối nội dung theo nhóm.

Các chức năng quản trị nâng cao như chuyển owner, lưu trữ lớp và màn hình cài đặt lớp tiếp tục được hoàn thiện cùng giai đoạn hardening.

## Giai đoạn 2 — tổ chức dạy học

Trạng thái: **Hoàn thành mã nguồn, chờ áp migration và kiểm tra production**.

Đã triển khai:

- Bảng tin: bài nháp, đăng ngay, hẹn giờ, ghim, chỉnh sửa/lưu trữ, khóa/xóa bình luận và tối đa 10 tài liệu đính kèm.
- Lịch học: một lần, lặp 4/8/12 tuần, địa điểm, link online, chỉnh sửa và hủy buổi.
- Bài giảng: module, nội dung/video, nháp/hẹn giờ/xuất bản và tiến độ học sinh.
- Tài liệu lớp: link ngoài, upload private tối đa 50 MB và signed URL tải xuống.
- Target cả lớp hoặc một nhóm cho bảng tin, lịch, bài giảng và tài liệu.
- Dashboard tổng hợp lớp/lịch; thông báo có deep link khi nội dung được xuất bản hoặc lịch thay đổi/hủy.
- RLS cho toàn bộ dữ liệu dạy học và Storage; tệp target nhóm chỉ cấp quyền cho đúng nhóm.

Việc cần làm trên production:

1. Chạy `npx supabase@latest db push` để áp các migration chưa có, mới nhất là `202610260001`.
2. Chờ Vercel deploy commit mới trên `main`.
3. Dùng tài khoản giáo viên/học sinh demo để chạy mục Auth, Lớp học, Nội dung và lịch trong checklist production.
4. Chỉ chuyển sang Giai đoạn 3 sau khi xác nhận học sinh hai nhóm không xem chéo nội dung/tệp.
