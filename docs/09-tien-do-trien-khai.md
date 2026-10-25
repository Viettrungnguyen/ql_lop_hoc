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

Trạng thái: **Tiếp theo**.

Thứ tự triển khai:

1. Hồ sơ/onboarding đầy đủ.
2. Bảng `classes`, `class_members` và RLS helper.
3. Tạo/sửa/lưu trữ lớp.
4. Mã tham gia, link mời và duyệt thành viên.
5. Vai trò/capability, chuyển owner.
6. Nhóm học tập và target theo nhóm.
