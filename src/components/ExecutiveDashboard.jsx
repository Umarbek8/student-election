import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Crown,
  Users2,
  LogOut,
  FileDown,
  ShieldCheck,
  LockKeyhole,
  Unlock,
  ArrowLeft,
} from "lucide-react";
import { CANDIDATES } from "../data/candidates";
import { ELECTION_CLOSED_NOTICE } from "../constants";
import {
  subscribeToVoteCounts,
  subscribeToAuditLog,
  subscribeToElectionStatus,
  setElectionOpen,
  deleteVote,
} from "../firebase";

// Give each candidate a stable identity color, reused between their progress
// bar and their marker in the audit log so the two views read as one system.
const IDENTITY_COLORS = [
  { bar: "from-signal-indigo to-indigo-300", dot: "bg-signal-indigo" },
  { bar: "from-signal-violet to-purple-300", dot: "bg-signal-violet" },
  { bar: "from-signal-cyan to-cyan-200", dot: "bg-signal-cyan" },
  { bar: "from-signal-magenta to-pink-300", dot: "bg-signal-magenta" },
];

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "just now";
  return timestamp.toDate().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function exportOfficialReport(results, log, totalVotes) {
  const generatedAt = new Date();
  const pdf = new jsPDF({ unit: "pt" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Official Student Leadership Election Results", 40, 48);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    `Generated ${generatedAt.toLocaleString()} \u2014 ${totalVotes} vote${
      totalVotes === 1 ? "" : "s"
    } recorded in total`,
    40,
    66
  );

  autoTable(pdf, {
    startY: 84,
    head: [["Rank", "Candidate", "Grade", "Votes", "Percentage"]],
    body: results.map((c, i) => [
      i === 0 && c.votes > 0 ? "1 (Leading)" : `${i + 1}`,
      c.name,
      c.grade,
      String(c.votes),
      `${c.pct}%`,
    ]),
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  const afterResultsY = pdf.lastAutoTable.finalY;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(20);
  pdf.text("Voter Audit Trail", 40, afterResultsY + 28);

  autoTable(pdf, {
    startY: afterResultsY + 40,
    head: [["Student Name", "Grade", "Candidate", "Timestamp"]],
    body: log.map((entry) => [
      entry.studentName,
      entry.grade,
      entry.candidateName,
      formatTime(entry.timestamp),
    ]),
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9, cellPadding: 5 },
  });

  pdf.save(`election-results-${generatedAt.toISOString().slice(0, 10)}.pdf`);
}

function LockToggle({ open, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      onClick={() => onChange(!open)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shrink-0 ${
        open ? "bg-signal-gradient" : "bg-slate-700"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="h-6 w-6 rounded-full bg-white shadow flex items-center justify-center"
        style={{ marginLeft: open ? "calc(100% - 26px)" : "2px" }}
      >
        {open ? (
          <Unlock className="h-3.5 w-3.5 text-signal-indigo" />
        ) : (
          <LockKeyhole className="h-3.5 w-3.5 text-slate-500" />
        )}
      </motion.span>
    </button>
  );
}

export default function ExecutiveDashboard({ onLogout, onBack }) {
  const [counts, setCounts] = useState({});
  const [log, setLog] = useState([]);
  const [electionOpen, setLocalElectionOpen] = useState(true);
  const [deletingVoteIds, setDeletingVoteIds] = useState({});

  useEffect(() => {
    const unsubCounts = subscribeToVoteCounts(setCounts);
    const unsubLog = subscribeToAuditLog(setLog);
    const unsubStatus = subscribeToElectionStatus(setLocalElectionOpen);
    return () => {
      unsubCounts();
      unsubLog();
      unsubStatus();
    };
  }, []);

  const handleDeleteVote = async (entry) => {
    if (!entry?.id) return;

    setDeletingVoteIds((prev) => ({ ...prev, [entry.id]: true }));

    try {
      await deleteVote(entry.id, entry.candidateId);
    } catch (error) {
      console.error("Failed to delete vote:", error);
    } finally {
      setDeletingVoteIds((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
    }
  };

  const totalVotes = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + (n || 0), 0),
    [counts]
  );

  const results = useMemo(() => {
    return CANDIDATES.map((c, i) => ({
      ...c,
      votes: Number(counts[c.id] || 0),
      pct: totalVotes > 0 ? ((Number(counts[c.id] || 0) / totalVotes) * 100) : 0,
      color: IDENTITY_COLORS[i % IDENTITY_COLORS.length],
    })).sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  }, [counts, totalVotes]);

  const topVoteCount = results[0]?.votes ?? 0;
  const tiedLeaders = useMemo(
    () => (topVoteCount > 0 ? results.filter((candidate) => candidate.votes === topVoteCount) : []),
    [results, topVoteCount]
  );
  const leaderLabel = tiedLeaders.length > 1
    ? `Tie for 1st: ${tiedLeaders.map((candidate) => candidate.name).join(", ")}`
    : tiedLeaders[0]
      ? `${tiedLeaders[0].name} — ${tiedLeaders[0].votes} vote${tiedLeaders[0].votes === 1 ? "" : "s"} (${tiedLeaders[0].pct.toFixed(2)}%)`
      : "No votes yet";
  const hasVotes = totalVotes > 0;

  return (
    <div className="min-h-screen flex flex-col px-5 sm:px-8 py-6 sm:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 transition hover:border-signal-cyan/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-signal-cyan font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Executive dashboard
            </p>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white mt-1">
              Live election results
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 glass rounded-xl px-3.5 py-2">
            <span className="text-xs text-slate-300">
              {electionOpen ? "Voting is open" : "Voting is closed"}
            </span>
            <LockToggle
              open={electionOpen}
              onChange={(next) => {
                setLocalElectionOpen(next);
                setElectionOpen(next);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => exportOfficialReport(results, log, totalVotes)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-signal-cyan/50 hover:bg-slate-800/40 transition-colors px-3 py-2 text-xs sm:text-sm text-slate-300"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Print / Export Official PDF Report</span>
            <span className="sm:hidden">Export PDF</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-red-400/40 hover:bg-red-500/10 transition-colors px-3 py-2 text-xs sm:text-sm text-slate-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {!electionOpen && (
        <div className="mb-6 rounded-xl border border-signal-magenta/30 bg-signal-magenta/10 px-4 py-3 text-sm text-pink-200">
          {ELECTION_CLOSED_NOTICE} Students cannot submit new votes while the toggle above is off.
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
        <Users2 className="h-4 w-4" />
        {totalVotes} vote{totalVotes === 1 ? "" : "s"} recorded so far
      </div>

      <AnimatePresence mode="wait">
        {hasVotes && (
          <motion.div
            key={leaderLabel}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-signal-gold/40 bg-signal-gold/10 px-4 py-3.5 flex items-center gap-3 shadow-glow-gold mb-6 max-w-3xl"
          >
            <Crown className="h-6 w-6 text-signal-gold shrink-0" />
            <div>
              <p className="text-xs text-signal-gold/90 font-medium">
                {tiedLeaders.length > 1 ? "Tied for 1st" : "Currently leading"}
              </p>
              <p className="font-display font-bold text-white">
                {leaderLabel}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
        <section className="glow-ring glass rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-slate-300">Results by candidate</h2>
          {results.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white">
                  <span className={`h-2 w-2 rounded-full ${c.color.dot}`} />
                  {c.name}
                </span>
                <span className="text-slate-400">
                  {c.votes} &middot; {c.pct.toFixed(2)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-base-900/80 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${c.color.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(c.pct, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="glow-ring glass rounded-2xl p-5 sm:p-6 flex flex-col gap-3 min-h-0">
          <h2 className="text-sm font-medium text-slate-300">Voter audit log</h2>
          <div className="flex-1 overflow-y-auto thin-scroll flex flex-col gap-2 pr-1 max-h-[28rem]">
            {log.length === 0 && (
              <p className="text-sm text-slate-500">No votes recorded yet.</p>
            )}
            {log.map((entry) => {
              const idx = CANDIDATES.findIndex((c) => c.id === entry.candidateId);
              const color = IDENTITY_COLORS[idx % IDENTITY_COLORS.length] || IDENTITY_COLORS[0];
              return (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-base-900/60 border border-slate-800 px-3 py-2.5 text-sm"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${color.dot}`} />
                    <div className="min-w-0">
                      <p className="text-white truncate">
                        {entry.studentName}{" "}
                        <span className="text-slate-500 font-normal">({entry.grade})</span>
                      </p>
                      <p className="text-slate-400 text-xs">
                        Voted for {entry.candidateName} &middot; {formatTime(entry.timestamp)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteVote(entry)}
                    disabled={Boolean(deletingVoteIds[entry.id])}
                    className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingVoteIds[entry.id] ? "Deleting..." : "Delete"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
