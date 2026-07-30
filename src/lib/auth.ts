import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export function getAuthUser() {
  return null;
}

export async function getCurrentUser() {
  // Placeholder — returns null (auth is handled client-side via localStorage)
  return null;
}
