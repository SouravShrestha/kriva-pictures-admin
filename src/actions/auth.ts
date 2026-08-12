"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (password !== env.adminPassword) {
    redirect("/login?error=1");
  }
  const token = await signToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
