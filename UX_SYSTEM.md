# UX Management System — Developer Guide

This document explains the centralized UX system in `src/ux/`. Read this before adding any banner, modal, toast, tour, or prompt to the app.

---

## What the system does

Every user-facing guidance element — banners, modals, tours, toasts, onboarding flows, feature announcements — is driven from one place. You define a **campaign** as a config object. The system evaluates conditions at runtime, manages storage, deduplicates logic, and renders everything through a single `<UXRenderer />` mount.

You do not write new components for routine campaigns. You write config.

---

## File map

```
src/ux/
├── campaignConfig.jsx          ← THE master list. Edit this to add/change campaigns.
├── campaignService.js          ← Storage read/write (local / session / firestore / both)
├── UXProvider.jsx              ← React context + useUX() hook
├── components/
│   ├── UXRenderer.jsx          ← Single mount point in App.jsx
│   ├── CampaignBanner.jsx      ← Renders 'banner' campaigns (info + merge variants)
│   ├── CampaignModal.jsx       ← Renders 'modal' campaigns (whats-new + generic)
│   ├── TourRunner.jsx          ← Renders 'tour' campaigns via react-joyride
│   ├── UXTooltip.jsx           ← Shared Joyride tooltip (3 variants)
│   ├── ToastContainer.jsx      ← Renders toast queue + FCM foreground push
│   ├── NotificationPromptBanner.jsx  ← Notification permission prompt
│   └── InstallPromptWrapper.jsx      ← PWA install prompt
├── hooks/
│   └── useToast.js             ← Imperative toast API: toast.success() etc.
└── admin/
    └── UXCampaignAdmin.jsx     ← Admin panel (in AdminServices → Onboarding tab)
```

---

## Adding a new campaign (the only thing you usually need to do)

Open `src/ux/campaignConfig.jsx` and add one object to the `CAMPAIGNS` array.

### Minimal example — a banner

```js
{
  id: 'my-feature-v1',          // unique, stable — used as storage key
  type: 'banner',               // 'banner' | 'modal' | 'tour' | 'prompt'
  priority: 60,                 // 1–100, higher = shown first
  storage: 'local',             // 'local' | 'session' | 'firestore' | 'both'
  blocking: false,
  dismissible: true,
  condition: (user) => !!user,  // any JS expression — user is currentUser
  content: {
    variant: 'info',            // 'info' | 'merge'
    icon: SomeIcon,             // lucide-react icon component
    title: 'New feature!',
    body: 'Here is what changed.',
    cta: 'Try it',              // optional button label
    ctaRoute: '/some-route',    // optional navigation target on CTA click
  },
},
```

Place `<CampaignBanner campaignId="my-feature-v1" />` wherever you want it to appear (e.g. in a page or in `StudentDashboard`). If you want it app-wide and at the top, add it inside `UXRenderer.jsx`.

### Announcement modal

```js
{
  id: 'new-term-announcement-v1',
  type: 'modal',
  priority: 75,
  storage: 'both',              // local + firestore = cross-device
  blocking: false,
  dismissible: true,
  condition: (user) => !!(user && !user.newTermSeen_v1),
  content: {
    variant: 'whats-new',
    badge: Sparkles,
    title: 'New Term, New Features',
    subtitle: 'Here is what changed this term:',
    features: [
      { icon: BookMarked, color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)',
        title: 'Feature A', body: 'Description of feature A.' },
    ],
    tourSteps: [],              // optional — leave empty for modal-only
  },
},
```

`<CampaignModal campaignId="new-term-announcement-v1" />` is already handled by `UXRenderer` for any `type: 'modal'` campaign — no extra mount needed.

### Feature tour

```js
{
  id: 'my-page-tour-v1',
  type: 'tour',
  priority: 35,
  storage: 'local',
  blocking: false,
  dismissible: true,
  condition: (user) => !!(user && !localStorage.getItem(`ux_my-page-tour-v1_${user.phone}`)),
  content: {
    getSteps: (user) => [
      {
        target: '[data-tour="my-element"]',
        title: 'This is the thing',
        content: 'Here is what it does.',
        placement: 'bottom',
        totalSteps: 2,
        disableBeacon: true,
      },
      {
        target: '.nav-user-menu',
        title: 'And here is the menu',
        content: 'Click your initials to access settings.',
        totalSteps: 2,
        disableBeacon: true,
      },
    ],
    role: null,  // or (user) => user.role for role-aware gradient
  },
},
```

Then in the page where you want the tour to run, use `TourRunner` directly:

```jsx
import TourRunner from '../ux/components/TourRunner';
import { useUX } from '../ux/UXProvider';
import { getCampaign } from '../ux/campaignConfig';

function MyPage() {
  const { isActive, complete } = useUX();
  const campaign = getCampaign('my-page-tour-v1');
  const [run, setRun] = useState(isActive('my-page-tour-v1'));

  return (
    <>
      <TourRunner
        campaignId="my-page-tour-v1"
        steps={campaign?.content.getSteps(currentUser) ?? []}
        run={run}
        variant="tour"
        onComplete={() => { setRun(false); complete('my-page-tour-v1'); }}
      />
      {/* rest of page */}
    </>
  );
}
```

---

## Showing a toast imperatively

Use `useToast` anywhere inside `<UXProvider>`:

```jsx
import { useToast } from '../ux/hooks/useToast';

function SomeComponent() {
  const { toast } = useToast();

  async function handleSave() {
    await saveData();
    toast.success('Saved!');                          // 4s auto-dismiss
    toast.info('Processing…', 'This may take a moment.');
    toast.warning('Check your input', undefined, '/profile');
    toast.push('New notice', 'Tap to read', '/notices'); // push-style
  }
}
```

All toasts stack in the bottom-right `ToastContainer` and auto-dismiss. No state management needed.

---

## Checking if a campaign is active

```jsx
import { useUX } from '../ux/UXProvider';

const { isActive } = useUX();
if (isActive('marks-banner-v1')) {
  // campaign is in the queue and not dismissed yet
}
```

---

## Dismissing a campaign from code

```jsx
const { dismiss, complete } = useUX();

// User closed it (same effect — both write to storage and remove from queue)
await dismiss('marks-banner-v1');

// Semantic alias for "user finished this flow"
await complete('onboarding-v1');
```

---

## Storage strategies

| Strategy | Where stored | Survives | Cross-device? |
|---|---|---|---|
| `local` | `localStorage` | Tab close, app refresh | No |
| `session` | `sessionStorage` | Tab focus changes | No — resets on new tab |
| `firestore` | Firestore user doc | Everything | Yes |
| `both` | localStorage + Firestore | Everything | Yes |

Use `both` for anything important (onboarding, major announcements). Use `local` for minor one-time banners. Use `session` for "don't show again this session" reminders. Avoid `firestore`-only unless you need cross-device without localStorage.

### Legacy Firestore field mapping

These existing Firestore fields on the user doc are automatically mapped to campaign IDs — no migration needed:

| Campaign ID | Firestore field |
|---|---|
| `onboarding-v1` | `onboardingCompleted` |
| `whats-new-v1` | `whatsNewSeen_v1` |
| `merge-banner-v1` | `mergeBannerSeen` |

All other campaigns use `ux_{campaignId}` as the Firestore field name.

---

## Priority guide

| Range | Use for |
|---|---|
| 90–100 | Critical blocking flows (merge banner, mandatory password reset) |
| 70–89 | First-run onboarding, major announcements (What's New) |
| 50–69 | Feature announcements, notification prompts |
| 30–49 | Page-specific tours, secondary prompts |
| 1–29 | Low-priority tips, optional guidance |

---

## Campaign types and their renderers

| `type` | Renderer | Mount location |
|---|---|---|
| `banner` | `CampaignBanner` | In the page/dashboard, or `UXRenderer` |
| `modal` | `CampaignModal` | `UXRenderer` (auto) |
| `tour` | `TourRunner` | In the page, or `UXRenderer` for global tours |
| `prompt` | `NotificationPromptBanner` or custom | `UXRenderer` |
| `toast` | `ToastContainer` via `useToast()` | `UXRenderer` (auto) |

---

## Admin tools

Go to **Admin Services → Onboarding tab** to see the `UXCampaignAdmin` panel. It shows:

- All campaigns with live status (active = green dot, dismissed = grey)
- Per-campaign reset button (re-shows that campaign for your account)
- Reset All button
- Test tour buttons for each role

---

## Naming convention for campaign IDs

```
{feature-name}-{type}-v{number}

Examples:
  onboarding-v1
  whats-new-v1
  study-together-announcement-v1
  marks-banner-v1
  notes-tour-v1
```

Always end with `-v{n}`. Increment the version when you want to re-show a campaign to users who already dismissed the previous version (since it uses a new storage key).

---

## Current campaigns

| ID | Type | Priority | Storage | Condition summary |
|---|---|---|---|---|
| `merge-banner-v1` | banner | 100 | firestore | Account was merged + banner not seen |
| `onboarding-v1` | tour | 90 | both | First login, not admin |
| `whats-new-v1` | modal | 80 | both | After onboarding, not seen |
| `study-together-announcement-v1` | banner | 65 | local | Any logged-in user, not seen |
| `notif-prompt-v1` | prompt | 60 | local | Push supported, permission default |
| `email-reminder-v1` | banner | 50 | session | Student, no email set |
| `marks-banner-v1` | banner | 70 | local | Student with roll number |
| `notes-tour-v1` | tour | 30 | local | Student, first visit to Notes page |

---

## Adding a new banner variant (for genuinely new UI shapes)

If `CampaignBanner`'s `info` and `merge` variants don't fit, add a new variant:

1. Add a `variant: 'my-variant'` key to your campaign's `content` object in `campaignConfig.jsx`.
2. Open `src/ux/components/CampaignBanner.jsx` and add an `if (content.variant === 'my-variant')` block returning your JSX.
3. Use `useUX().dismiss(campaignId)` to handle dismissal inside the block.

---

## What NOT to do

- Do not write `localStorage.setItem('some_banner_dismissed', '1')` in a page or component. Use `campaignService.markCampaignSeen()` or `useUX().dismiss()`.
- Do not create a new Joyride `tooltipComponent` function. Use `UXTooltip` with a `variant` prop.
- Do not create standalone banner components. Write a config entry and use `CampaignBanner`.
- Do not add new `<SomeBanner />` mounts inside `App.jsx`. Add the render logic to `UXRenderer.jsx` if truly app-global, or place `<CampaignBanner>` inline in the relevant page.
