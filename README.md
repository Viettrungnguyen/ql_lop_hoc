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
- [ ] Giai đoạn 1: tài khoản và lớp học.
- [ ] Giai đoạn 2: tổ chức dạy học.
- [ ] Giai đoạn 3: bài tập, chấm và bảng điểm.
- [ ] Giai đoạn 4: kho học liệu.
- [ ] Giai đoạn 5: hardening và phát hành P0.

## Cấu hình production

1. Tạo Supabase project và chạy migration trong `supabase/migrations`.
2. Chạy `supabase/seed.sql` để nạp taxonomy cơ bản.
3. Khai báo các biến trong `.env.example` trên Vercel.
4. Cấu hình Supabase Auth Site URL và Redirect URL về domain Vercel.
5. Deploy repository lên Vercel.

Theo yêu cầu dự án, việc kiểm tra chức năng được thực hiện trên môi trường production. Checklist nằm tại [docs/07-deploy-va-kiem-tra-prod.md](./docs/07-deploy-va-kiem-tra-prod.md).
