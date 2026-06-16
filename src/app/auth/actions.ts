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
  path: "/login" | "/signup",
  type: "error" | "message",
  message: string,
): never {
  const searchParams = new URLSearchParams({ [type]: message });

  redirect(`${path}?${searchParams.toString()}`);
}

function requireAuthConfig(path: "/login" | "/signup") {
  if (!isSupabaseConfigured()) {
    redirectWithStatus(
      path,
      "error",
      "Supabase is not configured yet. Add your project URL and publishable key to .env.local.",
    );
  }
}

async function getAuthCallbackUrl() {
  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", origin);

  callbackUrl.searchParams.set("next", "/app");

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

export async function signOut() {
  requireAuthConfig("/login");

  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login");
}
