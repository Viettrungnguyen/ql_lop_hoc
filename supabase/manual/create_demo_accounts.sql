-- TẠO TÀI KHOẢN DEMO ĐÃ XÁC MINH EMAIL
--
-- Cách chạy:
--   1. Mở Supabase Dashboard -> SQL Editor -> New query.
--   2. Dán toàn bộ file này và chọn Run.
--   3. Sao chép email/password từ result cuối cùng ngay sau khi chạy.
--
-- Cảnh báo:
--   - Chỉ dùng tạm thời để kiểm tra production.
--   - File này cố ý nằm ngoài supabase/migrations và không tự chạy khi deploy.
--   - Chạy lại script sẽ đặt mật khẩu mới cho cả hai tài khoản.
--   - Supabase khuyến nghị tạo user bằng Admin API. Script SQL trực tiếp này chỉ
--     dành cho việc bootstrap tài khoản test có thời hạn.

begin;

create temporary table demo_account_credentials (
  account_type text not null,
  email text not null,
  password text not null
);

do $$
declare
  demo_account record;
  demo_user_id uuid;
  demo_identity_id uuid;
  demo_password text;
begin
  for demo_account in
    select *
    from (
      values
        ('teacher', 'teacher.demo@example.com', 'Giáo viên Demo'),
        ('student', 'student.demo@example.com', 'Học sinh Demo')
    ) as accounts(onboarding_mode, email, display_name)
  loop
    -- Password không được hardcode vào Git. Mỗi lần chạy tạo một password mới,
    -- đủ chữ hoa, chữ thường, số, ký hiệu và chuỗi ngẫu nhiên.
    demo_password := 'Demo@2026-' || encode(extensions.gen_random_bytes(12), 'hex');

    select users.id
      into demo_user_id
    from auth.users as users
    where lower(users.email) = lower(demo_account.email)
    limit 1;

    if demo_user_id is null then
      demo_user_id := gen_random_uuid();

      insert into auth.users (
        instance_id,
        id,
        aud,
        "role",
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change,
        email_change_token_new,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
      )
      values (
        '00000000-0000-0000-0000-000000000000'::uuid,
        demo_user_id,
        'authenticated',
        'authenticated',
        demo_account.email,
        extensions.crypt(demo_password, extensions.gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        jsonb_build_object(
          'provider', 'email',
          'providers', jsonb_build_array('email')
        ),
        jsonb_build_object(
          'display_name', demo_account.display_name,
          'onboarding_mode', demo_account.onboarding_mode,
          'email_verified', true,
          'is_demo', true
        ),
        false,
        now(),
        now()
      );
    else
      -- Script có thể chạy lại: xác minh email và reset password demo.
      update auth.users
      set encrypted_password = extensions.crypt(
            demo_password,
            extensions.gen_salt('bf')
          ),
          email_confirmed_at = now(),
          confirmation_token = '',
          recovery_token = '',
          email_change = '',
          email_change_token_new = '',
          raw_app_meta_data = jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
          ),
          raw_user_meta_data = jsonb_build_object(
            'display_name', demo_account.display_name,
            'onboarding_mode', demo_account.onboarding_mode,
            'email_verified', true,
            'is_demo', true
          ),
          updated_at = now()
      where id = demo_user_id;
    end if;

    -- Email/password login cần một email identity tương ứng với auth user.
    select identities.id
      into demo_identity_id
    from auth.identities as identities
    where identities.user_id = demo_user_id
      and identities.provider = 'email'
    limit 1;

    if demo_identity_id is null then
      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        demo_user_id,
        demo_user_id::text,
        jsonb_build_object(
          'sub', demo_user_id::text,
          'email', demo_account.email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    else
      update auth.identities
      set provider_id = demo_user_id::text,
          identity_data = jsonb_build_object(
            'sub', demo_user_id::text,
            'email', demo_account.email,
            'email_verified', true,
            'phone_verified', false
          ),
          updated_at = now()
      where id = demo_identity_id;
    end if;

    -- Trigger của dự án sẽ tạo profile khi insert auth.users. Upsert bên dưới
    -- giúp script vẫn sửa đúng profile nếu tài khoản demo đã tồn tại.
    insert into public.profiles (
      id,
      display_name,
      onboarding_mode,
      email_notifications
    )
    values (
      demo_user_id,
      demo_account.display_name,
      demo_account.onboarding_mode::public.onboarding_mode,
      false
    )
    on conflict (id) do update
    set display_name = excluded.display_name,
        onboarding_mode = excluded.onboarding_mode,
        email_notifications = false,
        updated_at = now();

    insert into demo_account_credentials (account_type, email, password)
    values (demo_account.onboarding_mode, demo_account.email, demo_password);
  end loop;
end;
$$;

commit;

-- Để SELECT là statement cuối cùng, giúp SQL Editor luôn hiển thị credentials.
-- Kết quả chứa password dạng rõ và chỉ tồn tại trong phiên SQL hiện tại.
-- Sao chép ngay, không commit/chụp màn hình/chia sẻ ngoài nhóm phát triển.
select account_type, email, password
from demo_account_credentials
order by account_type;

-- XÓA TÀI KHOẢN DEMO SAU KHI KIỂM TRA
-- Bỏ comment và chạy riêng câu lệnh dưới đây. Nếu demo user đã upload file,
-- cần xóa/chuyển quyền các Storage object do user sở hữu trước.
--
-- delete from auth.users
-- where email in ('teacher.demo@example.com', 'student.demo@example.com');
