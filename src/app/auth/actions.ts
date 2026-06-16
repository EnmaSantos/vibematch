"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithStatus(
  path: "/forgot-password" | "/login" | "/reset-password" | "/signup",
  type: "error" | "message",
  message: string,
): never {
  const searchParams = new URLSearchParams({ [type]: message });

  redirect(`${path}?${searchParams.toString()}`);
}

function requireAuthConfig(
  path: "/forgot-password" | "/login" | "/reset-password" | "/signup",
) {
  if (!isSupabaseConfigured()) {
    redirectWithStatus(
      path,
      "error",
      "Supabase is not configured yet. Add your project URL and publishable key to .env.local.",
    );
  }
}

async function getAuthCallbackUrl(next = "/app") {
  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", origin);

  callbackUrl.searchParams.set("next", next);

  return callbackUrl.toString();
}

export async function login(formData: FormData) {
  requireAuthConfig("/login");

  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");

  if (!email || !password) {
    redirectWithStatus("/login", "error", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithStatus("/login", "error", error.message);
  }

  redirect("/app");
}

export async function signup(formData: FormData) {
  requireAuthConfig("/signup");

  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  const displayName = formString(formData, "displayName").trim();

  if (!email || !password) {
    redirectWithStatus("/signup", "error", "Enter your email and password.");
  }

  if (password.length < 6) {
    redirectWithStatus(
      "/signup",
      "error",
      "Use at least 6 characters for your password.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: await getAuthCallbackUrl(),
    },
  });

  if (error) {
    redirectWithStatus("/signup", "error", error.message);
  }

  if (data.session) {
    redirect("/app");
  }

  redirectWithStatus(
    "/login",
    "message",
    "Check your email to confirm your VibeMatch account.",
  );
}

export async function resendConfirmation(formData: FormData) {
  requireAuthConfig("/login");

  const email = formString(formData, "email").trim().toLowerCase();

  if (!email) {
    redirectWithStatus("/login", "error", "Enter your email to resend confirmation.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(),
    },
  });

  if (error) {
    redirectWithStatus("/login", "error", error.message);
  }

  redirectWithStatus(
    "/login",
    "message",
    "If that account is waiting for confirmation, Supabase will send another email.",
  );
}

export async function requestPasswordReset(formData: FormData) {
  requireAuthConfig("/forgot-password");

  const email = formString(formData, "email").trim().toLowerCase();

  if (!email) {
    redirectWithStatus("/forgot-password", "error", "Enter your email first.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getAuthCallbackUrl("/reset-password"),
  });

  if (error) {
    redirectWithStatus("/forgot-password", "error", error.message);
  }

  redirectWithStatus(
    "/login",
    "message",
    "Check your email for a password reset link.",
  );
}

export async function updatePassword(formData: FormData) {
  requireAuthConfig("/reset-password");

  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    redirectWithStatus("/reset-password", "error", "Enter and confirm your new password.");
  }

  if (password.length < 6) {
    redirectWithStatus(
      "/reset-password",
      "error",
      "Use at least 6 characters for your password.",
    );
  }

  if (password !== confirmPassword) {
    redirectWithStatus("/reset-password", "error", "Those passwords do not match.");
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    redirectWithStatus(
      "/login",
      "error",
      "Open the latest password reset email before setting a new password.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithStatus("/reset-password", "error", error.message);
  }

  // Sign out the user to destroy the active password recovery session
  await supabase.auth.signOut();

  redirectWithStatus(
    "/login",
    "message",
    "Your password was updated. Sign in with the new one.",
  );
}

export async function signOut() {
  requireAuthConfig("/login");

  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePasswordFromSettings(formData: FormData) {
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    redirect("/app/settings?error=Enter and confirm your new password.");
  }

  if (password.length < 6) {
    redirect("/app/settings?error=Use at least 6 characters for your password.");
  }

  if (password !== confirmPassword) {
    redirect("/app/settings?error=Passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app/settings?message=Password updated successfully.");
}

export async function updateProfileSettings(formData: FormData) {
  const displayName = formString(formData, "displayName").trim();

  if (!displayName) {
    redirect("/app/settings?error=Display name cannot be empty.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app/settings?message=Profile updated successfully.");
}

export async function verifyOtpCode(formData: FormData) {
  const email = formString(formData, "email").trim().toLowerCase();
  const token = formString(formData, "token").trim();
  const type = formString(formData, "type") as any;

  const redirectParams = new URLSearchParams({ email, type });

  if (!email || !token || !type) {
    redirect(`/verify?error=Enter your email and the 6-digit code.&${redirectParams.toString()}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    redirect(`/verify?error=${encodeURIComponent(error.message)}&${redirectParams.toString()}`);
  }

  if (type === "recovery") {
    redirect("/reset-password");
  } else {
    redirect("/app");
  }
}
