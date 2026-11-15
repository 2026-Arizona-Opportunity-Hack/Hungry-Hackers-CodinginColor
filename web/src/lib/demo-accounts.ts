/**
 * Public trial accounts shown on /login. Anyone can use them, so whatever they
 * change is kept in the visitor's own browser and reset on the next sign-in
 * (see teacher-store.ts). Created by `npm run seed:demo`.
 */
export const DEMO_TEACHER_EMAIL = "demo.teacher@example.com";
export const DEMO_TEACHER_PASSWORD = "CICdemo-2026!";

/**
 * The demo CIC admin. NOT shown on /login: it has full powers (publish
 * curriculum, add schools and accounts), so its password stays out of the code.
 * Set DEMO_TRIAL_ADMIN_PASSWORD in web/.env.local and run the seed to set or
 * change it; without it, an existing account keeps its current password.
 */
export const DEMO_ADMIN_EMAIL = "demo.admin@example.com";

/**
 * The demo external reviewer (curriculum with answer keys). Also NOT shown on
 * /login; set DEMO_TRIAL_REVIEWER_PASSWORD the same way to set or change it.
 */
export const DEMO_REVIEWER_EMAIL = "demo.reviewer@example.com";
