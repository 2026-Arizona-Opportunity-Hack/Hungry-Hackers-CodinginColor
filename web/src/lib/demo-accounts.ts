/**
 * The public trial admin. Shown on /login, so it is deliberately limited: it can
 * look at everything (every class, grant numbers, the curriculum editor, saving
 * private drafts) but the server refuses to publish curriculum or create
 * accounts for it. The owner's real admin account has no such limits.
 * Created by `npm run seed:demo`.
 */
export const DEMO_ADMIN_EMAIL = "demo.admin@example.com";
export const DEMO_ADMIN_PASSWORD = "CICadmin-2026!";
