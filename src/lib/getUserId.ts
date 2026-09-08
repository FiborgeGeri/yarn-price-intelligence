export function getUserId(): number | null {
  try {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.id ?? null;
    }
  } catch {}
  return null;
}
