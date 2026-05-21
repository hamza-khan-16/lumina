// ─── Admin credentials (client-side only — fine for a personal portfolio) ───
// Change these to your own username and password.
const ADMIN_USER = "lumina-admin";
const ADMIN_PASS = "mainamanhu";

const SESSION_KEY = "lumina_admin_session";

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
