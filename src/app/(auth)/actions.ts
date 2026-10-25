"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2).max(80),
  mode: z.enum(["teacher", "student"]),
});

function redirectWithMessage(
  path: string,
  type: "error" | "message",
  text: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(text)}`);
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return redirectWithMessage(
      "/login",
      "error",
      "Email hoặc mật khẩu chưa hợp lệ.",
    );
  }

  const credentials = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirectWithMessage("/login", "error", "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.");
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    return redirectWithMessage(
      "/register",
      "error",
      "Vui lòng điền đầy đủ và dùng mật khẩu từ 8 ký tự.",
    );
  }

  const account = parsed.data;
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        display_name: account.displayName,
        onboarding_mode: account.mode,
      },
    },
  });

  if (error) {
    redirectWithMessage("/register", "error", "Không thể tạo tài khoản. Email có thể đã được sử dụng.");
  }

  redirectWithMessage("/login", "message", "Kiểm tra email để xác minh tài khoản trước khi đăng nhập.");
}
