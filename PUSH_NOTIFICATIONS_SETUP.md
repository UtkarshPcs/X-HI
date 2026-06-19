# Push Notifications — Setup Guide

This app sends real web-push notifications (delivered even when the app is
closed) using **Firebase Cloud Messaging (FCM)** + a **Vercel serverless
function**. It runs entirely on the **free** Firebase Spark plan and Vercel
Hobby plan — no billing required.

Follow these one-time steps to make it work in production.

---

## 1. Generate a Web Push (VAPID) key

1. Firebase Console → your project (**balmy-nuance-472404-q9**)
2. ⚙️ **Project settings → Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the key string (starts with `B...`)

Add it to your local `.env` **and** to Vercel (as a build-time var):

```
VITE_FIREBASE_VAPID_KEY=BPaste_your_public_vapid_key_here
```

> This is a *public* key — safe to expose in the client bundle.

---

## 2. Create a service account (for the server to send pushes)

1. Firebase Console → ⚙️ **Project settings → Service accounts**
2. Click **Generate new private key** → downloads a JSON file
3. Open the JSON and copy these three fields:
   - `project_id`
   - `client_email`
   - `private_key` (the long `-----BEGIN PRIVATE KEY-----...` string)

> ⚠️ **Never commit this JSON.** It grants admin access to your project.

---

## 3. Add the service account to Vercel (env vars)

Vercel Dashboard → your project → **Settings → Environment Variables**.
Add these three (Production + Preview):

| Name                       | Value                                   |
| -------------------------- | --------------------------------------- |
| `FIREBASE_SA_PROJECT_ID`   | the `project_id` from the JSON          |
| `FIREBASE_SA_CLIENT_EMAIL` | the `client_email` from the JSON        |
| `FIREBASE_SA_PRIVATE_KEY`  | the full `private_key` string           |

Also add the VAPID key here so production builds pick it up:

| Name                      | Value                |
| ------------------------- | -------------------- |
| `VITE_FIREBASE_VAPID_KEY` | your public VAPID key |

**Tip for the private key:** paste it exactly as it appears in the JSON
(including the `\n` sequences). The server code converts `\n` back into real
newlines automatically.

After adding the vars, **redeploy** so they take effect.

---

## 4. How it works

- **Devices register:** when a logged-in user taps "Enable" on the
  notification banner, their FCM token is saved to `fcmTokens/{token}`.
- **Admin sends:** the admin (roll 23) uses **Admin Panel → Send Push
  Notification**, or it auto-fires when they post a notice / homework, or tap
  "Notify class of update" in the syllabus manager.
- **Server fans out:** `/api/send-notification` verifies the admin's secret
  `broadcastKey`, sends to every token via FCM, prunes dead tokens, and logs
  the message to `notifications/` (the history shown on the Profile page).

---

## 5. Notes & limits

- **iOS:** web push only works if the app is **installed to the home screen**
  (Add to Home Screen) on **iOS 16.4+**. The banner is hidden on iOS Safari
  until installed.
- **Permissions:** users who deny notifications simply won't receive pushes;
  nothing else breaks.
- **Cost:** FCM is free and unlimited. Firestore reads/writes and Vercel
  function calls stay far within the free tiers for a class-sized audience.
- **Security:** the service-account key lives only in Vercel env vars. The
  client never sees it. Admin sends are authorised by a per-admin secret key
  stored on the admin's user document.
