# Student Leadership Election

A dark, glassmorphic voting website for a school election. The landing screen
lets someone choose **Student** (go straight to voting) or **School
Leadership** (sign in with a master password to reach the executive
dashboard). Votes are recorded live to Firebase; the dashboard shows
real-time results, a full voter audit trail, an official PDF export, and a
switch to open or close the election system-wide.

## Stack

- React 18 + Vite
- Tailwind CSS (custom dark theme, see `tailwind.config.js`)
- Framer Motion for page transitions, hover effects, and the password-error shake
- Firebase Firestore for storage and real-time updates
- jsPDF + jspdf-autotable for the official results export
- lucide-react for icons

## 1. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a **Web app** to the project and copy the config values it gives you.
3. Enable **Firestore Database** (start in production mode).
4. Publish the rules in `firestore.rules` (Firestore > Rules tab), or adapt
   them to your school's requirements.
5. Copy `.env.example` to `.env.local` and fill in the six `VITE_FIREBASE_*`
   values, plus your own `VITE_ADMIN_PASSWORD`.

## 2. Install and run

```bash
npm install
npm run dev
```

Open the printed local URL on each shared device. For the live event, build
and serve the static output instead:

```bash
npm run build
npm run preview
```

## 3. How the flow works

- **Landing screen** — two cards: "Student" goes straight to the candidates
  grid; "School Leadership" opens a password modal.
- **Wrong password** shakes the modal and shows "Invalid Password." Correct
  password shows a "Good day, Boss!" toast, then opens the dashboard.
- **Voting** — a student taps "Vote Now," enters their name and grade, and
  confirms. The vote is written to Firestore and the candidate's live count
  increments. A duplicate name + grade is blocked with a message, since these
  are shared devices with no per-student login.
- **Executive dashboard** — live progress bars per candidate, the current
  leader highlighted, a scrollable audit log of every vote, a
  **Print / Export Official PDF Report** button, an **open/close** toggle for
  the election, and a **Logout** button back to the landing screen.
- **Closing the election** flips `meta/electionStatus.open` to `false` in
  Firestore. Every student device listening to that document immediately
  swaps the voting grid for a closed notice, and Firestore's own rules also
  reject any vote write while the election is closed.

## 4. Customize

- Edit `src/data/candidates.js` to swap in your real candidates, photos, and
  grade list (also used for the check-in dropdown via `GRADE_OPTIONS`).
- Change `VITE_ADMIN_PASSWORD` in `.env.local` before handing out devices.
- Firestore collections used:
  - `votes` — one document per vote: `studentName`, `grade`, `candidateId`,
    `candidateName`, `timestamp`.
  - `meta/voteCounts` — one document with a running integer field per
    candidate id, used for the live results bars.
  - `meta/electionStatus` — `{ open: boolean }`, toggled from the dashboard.

## Notes on integrity

The master password and the "already voted" check are convenience guards for
a shared-device classroom setting, not hardened security — the password is
checked in the browser, so anyone who reads the client bundle can find it. If
this election needs to be tamper-proof, add Firebase Authentication (e.g. a
real login for the principal) and tighten `firestore.rules` to check the
caller's identity instead of allowing open writes to `meta/*`.
