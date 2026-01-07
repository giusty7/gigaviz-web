# Stage 1 Manual Test Checklist

- Run `npm run dev`.
- Visit `/register`, submit a valid email + strong password, confirm the verify email notice.
- Visit `/login`, try to sign in before verifying and confirm the verification prompt.
- Visit `/forgot-password`, request a reset link (check email delivery if Resend is configured).
- Open the reset link and complete `/reset-password`, then sign in again.
- Visit `/app/onboarding`, create a workspace (Individual + Team) and verify redirect:
  - Individual → `/app/[slug]/dashboard`
  - Team → invite step (`/app/onboarding?step=invites...`) and then `/app/[slug]/dashboard`
