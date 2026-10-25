# Quản lý lớp học

Nền tảng LMS tập trung vào hoạt động giảng dạy: tổ chức lớp, lịch học, bài giảng, bài tập, chấm điểm và kho học liệu.

## Công nghệ

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, RLS và Storage
- Vercel

## Trạng thái

Đang triển khai theo từng giai đoạn trong [docs/06-roadmap-va-backlog.md](./docs/06-roadmap-va-backlog.md).

- [x] Giai đoạn 0: nền tảng dự án, Auth SSR, migration cơ sở và giao diện khởi đầu.
- [x] Giai đoạn 1: nền tảng lớp học, thành viên, vai trò và nhóm.
- [x] Giai đoạn 2: bảng tin, lịch, bài giảng, tài liệu lớp, dashboard và thông báo.
- [ ] Giai đoạn 3: bài tập, chấm và bảng điểm.
- [ ] Giai đoạn 4: kho học liệu.
- [ ] Giai đoạn 5: hardening và phát hành P0.

## Cấu hình production

1. Tạo Supabase project và chạy migration trong `supabase/migrations`.
2. Chạy `supabase/seed.sql` để nạp taxonomy cơ bản.
3. Khai báo các biến trong `.env.example` trên Vercel.
4. Cấu hình Supabase Auth Site URL và Redirect URL về domain Vercel.
5. Deploy repository lên Vercel.

Hướng dẫn đầy đủ: [docs/HUONG-DAN-DEPLOY.md](./docs/HUONG-DAN-DEPLOY.md).

Theo yêu cầu dự án, việc kiểm tra chức năng được thực hiện trên môi trường production. Mã nguồn Giai đoạn 2 đã sẵn sàng để áp migration và smoke test; checklist nằm tại [docs/07-deploy-va-kiem-tra-prod.md](./docs/07-deploy-va-kiem-tra-prod.md).
