/**
 * The public trial CIC admin, shown on /login for the demo. It has FULL admin
 * powers (publish curriculum, add schools and accounts), so anyone who sees the
 * password can use them. Rotate the password or delete this account after the
 * demo and judging (Supabase -> Authentication -> Users, or re-run the seed with
 * a new password). Created by `npm run seed:demo`.
 */
export const DEMO_ADMIN_EMAIL = "demo.admin@example.com";
export const DEMO_ADMIN_PASSWORD = "CICadmin-2026!";
