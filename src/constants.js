// Master password for the School Leadership / Principal path. Override it by
// setting VITE_ADMIN_PASSWORD in your .env.local before deploying to real
// devices -- never ship the default value to a live election.
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "najwaubek28:22";

// Shown as an animated greeting toast immediately after a correct login.
export const ADMIN_GREETING = "Hello Najwa, have a great and productive day ✨";

export const ELECTION_CLOSED_NOTICE =
  "Voting for the Student Leadership Election has officially closed.";
