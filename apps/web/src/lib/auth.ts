import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorizedUser = {
  id: string;
  email: string;
  role: "admin" | "viewer";
  is_active: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hasRequiredRole(
  user: AuthorizedUser,
  requiredRole: AuthorizedUser["role"] = "admin",
) {
  if (requiredRole === "viewer") {
    return user.role === "viewer" || user.role === "admin";
  }

  return user.role === "admin";
}

export async function findAuthorizedUserByEmail(email: string) {
  const result = await query<AuthorizedUser>(
    `
      SELECT id, email, role, is_active
      FROM app_users
      WHERE email = $1 AND is_active = true
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return result.rows[0] ?? null;
}

export async function destroySession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function getSessionEmail() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email ? normalizeEmail(user.email) : null;
}

export async function getAuthorizedUser() {
  const email = await getSessionEmail();
  if (!email) {
    return null;
  }

  return findAuthorizedUserByEmail(email);
}

export async function requirePageAuth(
  requiredRole: AuthorizedUser["role"] = "admin",
) {
  const user = await getAuthorizedUser();
  if (!user || !hasRequiredRole(user, requiredRole)) {
    await destroySession();
    redirect("/login?error=unauthorized");
  }

  return user;
}

export async function requireApiAuth(
  requiredRole: AuthorizedUser["role"] = "admin",
) {
  const user = await getAuthorizedUser();
  if (!user || !hasRequiredRole(user, requiredRole)) {
    await destroySession();
    return null;
  }

  return user;
}
