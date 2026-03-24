# Zenvex Capital

Premium dark funded-trading MVP built with React + Vite, Firebase Authentication, Firestore, Tailwind CSS, and Razorpay via Firebase Functions.

## What is included

- Branded landing page, grouped challenges catalog, challenge details page, checkout flow, success page, rules page, payout policy page, and trader dashboard
- Firebase email/password authentication with session persistence
- Protected admin login and expanded admin panel for pricing, payouts, provisioning, analytics, and audit logs
- Firestore collections for `users`, `challenges`, `orders`, `dashboard`, private `accounts`, `payoutRequests`, `userActivity`, and `adminAuditLogs`
- Secure Razorpay flow using Firebase Functions for order creation, payment verification, payout requests, and admin review actions
- 15 live products across `Step 1`, `Step 2`, and `Instant Funded` paths from `5K` through `100K`
- Coupon-ready order snapshots using `listPrice`, `salePrice`, and `finalPrice`
- Telegram notification hooks for registration, purchase, payout request, and admin-triggered account status updates
- Protected routes, loading states, empty states, and responsive dark UI
- Local demo mode when Firebase env values are not added yet, so the client can still review the full UI flow

## GitHub + Vercel demo handoff

1. Upload this project to a GitHub repository.
2. Import the repository into Vercel.
3. Deploy as-is for a client demo.

What happens without env keys:

- Public pages render normally
- The auth page enters local demo mode
- Checkout simulates a successful purchase
- Dashboard shows locally stored sample trader data and payout history
- `/admin/login` opens a demo admin preview with sample users, orders, accounts, pricing, payout requests, and audit activity

What happens after env keys and Firebase secrets are added:

- Email/password auth becomes live
- Razorpay uses the real checkout flow
- Paid purchases automatically create `orders`, `accounts`, and `dashboard` records in Firestore
- The admin panel can review users, paid orders, pricing, breaches, payouts, MT credential delivery state, and analytics
- Payout requests are submitted from the trader dashboard and reviewed manually in admin
- Telegram alerts are sent for supported business events after the required secrets are configured

The included [vercel.json](./vercel.json) keeps React Router routes working on direct page refreshes.

## Local setup

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Install Firebase Functions dependencies:

   ```bash
   npm run functions:install
   ```

3. Create a `.env` file in the project root using `.env.example`.

4. Create a Firebase project, then enable:

- Authentication -> Email/Password
- Firestore Database
- Cloud Functions

5. Select your Firebase project from the CLI:

   ```bash
   firebase login
   firebase use --add
   ```

6. Add Razorpay secrets for Cloud Functions:

   ```bash
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   ```

7. Add Telegram secrets if you want admin alerts:

   ```bash
   firebase functions:secrets:set TELEGRAM_BOT_TOKEN
   firebase functions:secrets:set TELEGRAM_ADMIN_CHAT_ID
   ```

8. Create the single Firebase Authentication admin user with:

- email: `arbassyed777@gmail.com`
- password: use your approved private admin password in Firebase Authentication

9. Optional but recommended: set the admin email in your local `.env` file and deployment environment variables:

   ```bash
   VITE_ADMIN_EMAIL=arbassyed777@gmail.com
   ADMIN_EMAIL=arbassyed777@gmail.com
   ```

10. Run the frontend:

   ```bash
   npm run dev
   ```

11. Deploy when ready:

   ```bash
   npm run build
   firebase deploy
   ```

## Notes

- Traders now move through `Challenges -> Challenge Details -> Checkout -> Success -> Dashboard`.
- The public site includes shared `Rules` and `Payout Policy` views, plus discount badges and payout messaging on product cards.
- After payment, record creation is automatic. MT credentials are still entered by admin and shared manually by email in this MVP.
- Payout requests are manual-review workflows in v1. The dashboard shows eligibility snapshots, but admin approval is still required.
- Breach handling, suspicious-activity review, and payout consistency checks are manual in v1 because the app does not yet ingest live MT client equity or drawdown data.
- Phase 2 automation such as auto breach detection and MT5-driven status updates is intentionally not implemented yet.
- In demo mode, admin edits are browser-local and meant only for presentation on Vercel or local preview links.
- Admin passwords are intentionally not stored in code or committed to the repository.
- The in-app logo asset was recreated from the uploaded mark so the project is self-contained. If you later want to swap in the original file, replace `src/assets/zenvex-logo.svg`.
- For demo-only deployments, you do not need to set env variables. The app will switch to local presentation mode automatically.
