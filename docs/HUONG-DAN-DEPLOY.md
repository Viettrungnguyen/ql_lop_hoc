# Hướng dẫn deploy Supabase và Vercel

Tài liệu này là quy trình triển khai production duy nhất của dự án `ql_lop_hoc`.

## 1. Kiến trúc triển khai

```text
GitHub: Viettrungnguyen/ql_lop_hoc
├── Vercel: Next.js, giao diện và server actions
└── Supabase
    ├── Auth: tài khoản và phiên đăng nhập
    ├── PostgreSQL: dữ liệu nghiệp vụ và RLS
    └── Storage: avatar, tài liệu và bài nộp
```

Thứ tự triển khai:

1. Tạo Supabase project.
2. Đẩy migration và seed lên Supabase.
3. Import GitHub repository vào Vercel.
4. Khai báo biến môi trường.
5. Cấu hình Supabase Auth URL.
6. Redeploy Vercel và kiểm tra production.

## 2. Tạo Supabase project

1. Mở [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn **New project**.
3. Chọn Organization.
4. Đặt tên project, ví dụ `ql-lop-hoc`.
5. Tạo database password mạnh và lưu trong trình quản lý mật khẩu.
6. Chọn region gần Việt Nam nhất, ưu tiên Singapore nếu có.
7. Chọn **Create new project** và đợi project sẵn sàng.

Project ref nằm trong URL dashboard:

```text
https://supabase.com/dashboard/project/<project-ref>
```

## 3. Đẩy migration và seed lên Supabase

Mở PowerShell tại repository:

```powershell
cd "C:\Users\Administrator\Documents\Learn\shub clone new"
```

Đăng nhập Supabase CLI:

```powershell
npx supabase@latest login
```

Liên kết với production project:

```powershell
npx supabase@latest link --project-ref YOUR_PROJECT_REF
```

Thay `YOUR_PROJECT_REF` bằng project ref ở bước trước. Khi được hỏi, nhập database password đã tạo.

Đẩy migration và seed:

```powershell
npx supabase@latest db push --include-seed
```

Lệnh trên áp dụng:

- `supabase/migrations/202610250001_phase0_foundation.sql`
- `supabase/seed.sql`

Sau khi thành công, kiểm tra trong Supabase:

- **Table Editor** có `profiles`, `education_levels`, `grade_levels`, `subjects`, `grade_subjects`, `audit_logs`.
- **Storage** có `avatars`, `class-files`, `submissions`, `material-files`.
- Các bucket đều ở chế độ private.
- **Database → Migrations** ghi nhận migration `202610250001`.

Không chạy lại migration bằng SQL Editor sau khi `db push` đã thành công. Các thay đổi schema tiếp theo phải được tạo thành migration mới.

Tài liệu chính thức: [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations).

## 4. Lấy URL và API key của Supabase

Trong Supabase Dashboard, mở nút **Connect** hoặc **Project Settings → API Keys**.

Lấy hai giá trị:

```text
Project URL: https://xxxxxxxx.supabase.co
Publishable key: sb_publishable_xxxxxxxxx
```

Repo hiện dùng tên biến `NEXT_PUBLIC_SUPABASE_ANON_KEY`, nhưng giá trị nên là publishable key mới:

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxx
```

Publishable key được phép dùng trên browser vì quyền dữ liệu được giới hạn bằng RLS.

Secret key có dạng `sb_secret_...`:

- Không commit vào Git.
- Không đặt vào biến bắt đầu bằng `NEXT_PUBLIC_`.
- Chỉ lưu trong Vercel Production Environment khi backend thực sự cần.

Tài liệu chính thức: [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 5. Import repository vào Vercel

1. Mở [Vercel Dashboard](https://vercel.com/dashboard).
2. Chọn **Add New → Project**.
3. Kết nối GitHub nếu chưa kết nối.
4. Import repository `Viettrungnguyen/ql_lop_hoc`.
5. Kiểm tra cấu hình:

```text
Framework Preset: Next.js
Root Directory: .
Production Branch: main
Build Command: để mặc định
Output Directory: để mặc định
Install Command: để mặc định
```

File `vercel.json` đã đặt function region là Singapore (`sin1`). Dòng `Running build in Washington ... iad1` trong log chỉ là build machine; không phải region chạy function sau deploy.

Tài liệu chính thức: [Deploying Git Repositories with Vercel](https://vercel.com/docs/git).

## 6. Khai báo Environment Variables trên Vercel

Trong **Project → Settings → Environment Variables**, thêm:

### Biến bắt buộc ở Giai đoạn 0

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxx
```

Chọn môi trường:

- Production: bắt buộc.
- Preview: chỉ bật nếu preview deployment được phép dùng cùng Supabase project.

### Biến thêm sau khi biết production domain

Sau deployment đầu, Vercel cấp domain, ví dụ:

```text
https://ql-lop-hoc.vercel.app
```

Thêm:

```text
NEXT_PUBLIC_APP_URL=https://ql-lop-hoc.vercel.app
```

Không thêm dấu `/` cuối URL.

### Biến dành cho backend/job tương lai

```text
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxx
CRON_SECRET=<chuỗi ngẫu nhiên dài>
```

Hai biến này chưa cần để chạy Giai đoạn 0. Khi thêm:

- Chỉ chọn Production.
- Đánh dấu Sensitive.
- Không bao giờ dùng tiền tố `NEXT_PUBLIC_`.

Có thể sinh `CRON_SECRET` bằng Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sau khi thêm hoặc thay đổi environment variable, phải tạo deployment mới hoặc chọn **Redeploy**. Biến mới không được áp dụng ngược cho deployment cũ.

Tài liệu chính thức: [Vercel Environment Variables](https://vercel.com/docs/environment-variables).

## 7. Cấu hình Supabase Auth URL

Sau khi có production domain, vào:

**Supabase → Authentication → URL Configuration**

Đặt Site URL:

```text
https://ql-lop-hoc.vercel.app
```

Thêm Redirect URL:

```text
https://ql-lop-hoc.vercel.app/auth/callback
```

Nếu dùng custom domain, thêm chính xác domain đó:

```text
https://your-domain.com/auth/callback
```

Production nên dùng URL chính xác, không dùng wildcard. Nếu cần test Vercel Preview, có thể thêm wildcard preview riêng theo hướng dẫn của Supabase.

Tài liệu chính thức: [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 8. Cấu hình email đăng ký

Trong **Authentication → Providers → Email**:

- Bật Email provider.
- Bật Confirm email.
- Đặt OTP expiry ở mức hợp lý, khuyến nghị không quá 1 giờ.

SMTP mặc định của Supabase chỉ phù hợp cho thử nghiệm, có giới hạn gửi thấp và có thể chỉ gửi được tới email thành viên organization. Trước khi cho giáo viên/học sinh thật đăng ký, cấu hình SMTP riêng.

Provider có thể dùng:

- Resend
- Brevo
- Postmark
- AWS SES
- SendGrid

Đường dẫn cấu hình: **Authentication → Email/SMTP Settings**.

Các giá trị cần nhập:

```text
SMTP Host
SMTP Port
SMTP User
SMTP Password
Sender email
Sender name
```

Tài liệu chính thức: [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 9. Redeploy Vercel

Sau khi khai báo biến môi trường:

1. Vào **Vercel → Project → Deployments**.
2. Mở deployment gần nhất.
3. Chọn menu ba chấm → **Redeploy**.
4. Không bật tùy chọn sử dụng lại build cache nếu đang sửa lỗi dependency/build.
5. Đợi trạng thái chuyển thành **Ready**.

Các lần sau, mỗi commit mới trên `main` sẽ tự kích hoạt production deployment.

## 10. Kết nối GitHub Integration của Supabase

Sau lần deploy database đầu tiên, có thể bật tự động deploy migration:

1. Vào **Supabase → Project Settings → Integrations**.
2. Chọn **GitHub Integration → Authorize GitHub**.
3. Chọn repository `Viettrungnguyen/ql_lop_hoc`.
4. Working directory: `.`.
5. Production branch: `main`.
6. Bật deploy to production.

Supabase sẽ đọc migration trong `supabase/migrations` và áp dụng các file chưa có trong migration history.

Tài liệu chính thức: [Supabase GitHub Integration](https://supabase.com/docs/guides/deployment/branching/github-integration).

## 11. Smoke checklist production

### Giao diện và Auth

- [ ] `/` hiển thị landing page.
- [ ] `/register` hiển thị form đăng ký.
- [ ] Đăng ký thành công và nhận email xác minh.
- [ ] Link xác minh chuyển về `/auth/callback`, sau đó tới `/dashboard`.
- [ ] Supabase **Authentication → Users** có tài khoản mới.
- [ ] Bảng `public.profiles` có profile cùng user ID.
- [ ] Đăng xuất và đăng nhập lại thành công.
- [ ] Người chưa đăng nhập mở `/dashboard` sẽ bị chuyển tới `/login`.

### Database và Storage

- [ ] Taxonomy có cấp Tiểu học, THCS, THPT và khối 1–12.
- [ ] Các bucket Storage đều private.
- [ ] Security Advisor không báo bảng public thiếu RLS.
- [ ] Không có secret key trong GitHub, browser bundle hoặc build log.

## 12. Xử lý lỗi thường gặp

### TypeScript báo `parsed.data is possibly undefined`

Nguyên nhân: TypeScript không biết helper redirect luôn kết thúc luồng xử lý, nên không thu hẹp `safeParse` result.

Helper phải khai báo trả về `never`:

```ts
function redirectWithMessage(
  path: string,
  type: "error" | "message",
  text: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(text)}`);
}
```

Lỗi này đã được sửa trong source hiện tại.

### Có cảnh báo `Unknown env config cache-dir`

Đây là cảnh báo từ môi trường npm của Vercel, không phải nguyên nhân build thất bại. Build log đã tiếp tục qua bước cài dependency và compile.

### Cảnh báo `eslint@9 is no longer supported`

Đây là cảnh báo lifecycle của npm. Phiên bản hiện tại đang được ghim để tương thích với peer dependencies của `eslint-config-next`. Không phải lỗi khiến build dừng.

### Cảnh báo `install-scripts ... unrs-resolver`

Đây là cảnh báo npm/Vercel về install script của dependency gián tiếp. Không phải nguyên nhân của lỗi TypeScript đang được sửa. Không approve package tùy tiện nếu chưa xác minh dependency tree.

### Không nhận được email xác minh

Kiểm tra:

1. **Supabase → Authentication → Logs**.
2. Email có thuộc Supabase organization không nếu vẫn dùng SMTP mặc định.
3. Site URL và Redirect URL đã chính xác chưa.
4. Custom SMTP credentials và sender domain đã verify chưa.

### Xác minh email nhưng callback thất bại

Kiểm tra:

- Redirect URL có `/auth/callback`.
- `NEXT_PUBLIC_APP_URL` dùng HTTPS và đúng production domain.
- Environment variables đã được áp dụng bằng một deployment mới.
- Không dùng URL của deployment cũ đã bị thay thế.

### `supabase db push` báo migration history không đồng bộ

Chạy kiểm tra:

```powershell
npx supabase@latest migration list
```

Không chạy `migration repair` hoặc reset production khi chưa xác định migration nào đã được áp dụng. Production database không được reset.

## 13. Quy tắc an toàn production

- Không commit `.env`, database password, access token hoặc secret key.
- Không reset production database.
- Không sửa schema trực tiếp bằng Table Editor sau khi đã dùng migration.
- Mỗi thay đổi schema phải có migration mới.
- Secret key chỉ dùng server-side và bypass RLS; rò key đồng nghĩa có thể lộ toàn bộ dữ liệu.
- Trước migration phá vỡ schema, phải có backup và phương án forward-fix.
- Sau mỗi release, chạy lại smoke checklist liên quan.
