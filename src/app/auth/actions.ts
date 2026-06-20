"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidOtpCode, OTP_CODE_ERROR_MESSAGE } from "@/lib/auth/otp-code";
import { getAvatarInitials, hasPasswordAuth } from "@/lib/auth/user-profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next-path";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithStatus(
  path: "/forgot-password" | "/login" | "/reset-password" | "/signup",
  type: "error" | "message",
  message: string,
  next?: string,
): never {
  const searchParams = new URLSearchParams({ [type]: message });

  if (next && next !== "/app") {
    searchParams.set("next", safeNextPath(next));
  }

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
  const configuredAppUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  const configuredOrigin = configuredAppUrl
    ? configuredAppUrl.startsWith("http")
      ? configuredAppUrl
      : `https://${configuredAppUrl}`
    : "";
  const origin = headersList.get("origin") ?? configuredOrigin;
  const callbackUrl = new URL(
    "/auth/callback",
    origin || "http://localhost:3000",
  );

  callbackUrl.searchParams.set("next", next);

  return callbackUrl.toString();
}

function logAuthFailure(
  action: "login" | "signup" | "resendConfirmation" | "requestPasswordReset" | "updatePassword" | "signOut" | "changePasswordFromSettings" | "updateProfileSettings" | "verifyOtpCode",
  context: Record<string, unknown>,
  error: unknown,
) {
  console.error(`[auth:${action}] failed`, {
    ...context,
    error,
  });
}

type EmailOtpVerificationType = "signup" | "recovery" | "magiclink" | "email_change" | "email";

const emailOtpVerificationTypes = new Set<EmailOtpVerificationType>([
  "signup",
  "recovery",
  "magiclink",
  "email_change",
  "email",
]);

function isEmailOtpVerificationType(value: string): value is EmailOtpVerificationType {
  return emailOtpVerificationTypes.has(value as EmailOtpVerificationType);
}

export async function login(formData: FormData) {
  requireAuthConfig("/login");

  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirectWithStatus("/login", "error", "Enter your email and password.", next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logAuthFailure("login", { email }, error);
    redirectWithStatus("/login", "error", error.message, next);
  }

  redirect(next);
}

export async function signup(formData: FormData) {
  requireAuthConfig("/signup");

  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  const displayName = formString(formData, "displayName").trim();
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirectWithStatus("/signup", "error", "Enter your email and password.", next);
  }

  if (password.length < 6) {
    redirectWithStatus(
      "/signup",
      "error",
      "Use at least 6 characters for your password.",
      next,
    );
  }

  const supabase = await createClient();
  const callbackUrl = await getAuthCallbackUrl(next);

  console.info("[auth:signup] attempt", {
    email,
    displayName: displayName || email.split("@")[0],
    callbackUrl,
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    logAuthFailure(
      "signup",
      {
        email,
        callbackUrl,
        hasSession: Boolean(data.session),
        hasUser: Boolean(data.user),
      },
      error,
    );
    redirectWithStatus("/signup", "error", error.message, next);
  }

  if (data.session) {
    console.info("[auth:signup] created session", {
      email,
      userId: data.user?.id ?? null,
    });
    redirect(next);
  }

  redirectWithStatus(
    "/login",
    "message",
    "Check your email to confirm your VibeMatch account.",
    next,
  );
}

export async function resendConfirmation(formData: FormData) {
  requireAuthConfig("/login");

  const email = formString(formData, "email").trim().toLowerCase();

  if (!email) {
    redirectWithStatus("/login", "error", "Enter your email to resend confirmation.");
  }

  const supabase = await createClient();
  const callbackUrl = await getAuthCallbackUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    logAuthFailure("resendConfirmation", { email, callbackUrl }, error);
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
  const callbackUrl = await getAuthCallbackUrl("/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl,
  });

  if (error) {
    logAuthFailure("requestPasswordReset", { email, callbackUrl }, error);
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
    logAuthFailure(
      "updatePassword",
      { hasUser: Boolean(data.user) },
      userError ?? new Error("No authenticated user"),
    );
    redirectWithStatus(
      "/login",
      "error",
      "Open the latest password reset email before setting a new password.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    logAuthFailure("updatePassword", { userId: data.user.id }, error);
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

  console.info("[auth:signOut] attempt");
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePasswordFromSettings(formData: FormData) {
  const currentPassword = formString(formData, "currentPassword");
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  if (!currentPassword || !password || !confirmPassword) {
    redirect("/app/settings?error=Enter your current password and confirm your new password.");
  }

  if (password.length < 6) {
    redirect("/app/settings?error=Use at least 6 characters for your password.");
  }

  if (password !== confirmPassword) {
    redirect("/app/settings?error=Passwords do not match.");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    logAuthFailure(
      "changePasswordFromSettings",
      { hasUser: Boolean(userData.user) },
      userError ?? new Error("No authenticated user"),
    );
    redirect("/login");
  }

  if (!hasPasswordAuth(userData.user)) {
    redirect("/app/settings?error=Password changes are handled by your sign-in provider.");
  }

  if (!userData.user.email) {
    redirect("/app/settings?error=This account does not have an email password to update.");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });

  if (verifyError) {
    logAuthFailure("changePasswordFromSettings", { step: "verifyCurrentPassword" }, verifyError);
    redirect("/app/settings?error=Current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    logAuthFailure("changePasswordFromSettings", {}, error);
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
  
  // 1. Update Auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (authError) {
    logAuthFailure("updateProfileSettings", { displayName }, authError);
    redirect(`/app/settings?error=${encodeURIComponent(authError.message)}`);
  }

  // 2. Get user object to know the ID
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect(`/app/settings?error=${encodeURIComponent(userError?.message || "Could not retrieve user info.")}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email || "",
      display_name: displayName,
      avatar_initials: getAvatarInitials(displayName),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    logAuthFailure("updateProfileSettings", { displayName }, profileError);
    redirect(`/app/settings?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/app/settings?message=Profile updated successfully.");
}

export async function verifyOtpCode(formData: FormData) {
  const email = formString(formData, "email").trim().toLowerCase();
  const token = formString(formData, "token").trim();
  const type = formString(formData, "type");

  const redirectParams = new URLSearchParams({ email, type });

  if (!email || !isValidOtpCode(token) || !isEmailOtpVerificationType(type)) {
    redirect(`/verify?error=${encodeURIComponent(OTP_CODE_ERROR_MESSAGE)}&${redirectParams.toString()}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    logAuthFailure("verifyOtpCode", { email, type }, error);
    redirect(`/verify?error=${encodeURIComponent(error.message)}&${redirectParams.toString()}`);
  }

  if (type === "recovery") {
    redirect("/reset-password");
  } else {
    redirect("/app");
  }
}

export async function signInWithGoogle(formData: FormData) {
  await handleOAuthSignIn("google", formData);
}

export async function signInWithGithub(formData: FormData) {
  await handleOAuthSignIn("github", formData);
}

async function handleOAuthSignIn(provider: "google" | "github", formData: FormData) {
  requireAuthConfig("/login");
  const supabase = await createClient();
  const next = safeNextPath(formString(formData, "next"));
  const redirectTo = await getAuthCallbackUrl(next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    logAuthFailure("login", { provider }, error);
    redirectWithStatus("/login", "error", error.message, next);
  }

  if (data?.url) {
    redirect(data.url);
  } else {
    redirectWithStatus("/login", "error", `Could not initiate ${provider} login.`, next);
  }
}
