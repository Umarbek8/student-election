import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Vote, LockKeyhole } from "lucide-react";
import { CANDIDATES } from "../data/candidates";
import { ELECTION_CLOSED_NOTICE } from "../constants";
import { subscribeToElectionStatus } from "../firebase";
import CandidateCard from "./CandidateCard";
import VoteModal from "./VoteModal";
import Toast from "./Toast";

export default function StudentView({ onBack }) {
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [toast, setToast] = useState(null);
  const [electionOpen, setElectionOpen] = useState(true);

  useEffect(() => {
    const unsub = subscribeToElectionStatus(setElectionOpen);
    return unsub;
  }, []);

  const handleVoteRecorded = (candidate) => {
    setToast(`Thank you! Your vote for ${candidate.name} has been recorded.`);
    window.clearTimeout(handleVoteRecorded._t);
    handleVoteRecorded._t = window.setTimeout(() => setToast(null), 3600);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-center gap-3 px-4 sm:px-8 py-5 sm:py-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="text-slate-400 hover:text-white transition-colors absolute left-4 sm:left-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 text-center">
          <div className="h-9 w-9 rounded-lg bg-signal-gradient flex items-center justify-center shadow-glow">
            <Vote className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-base sm:text-lg leading-tight">
              Student Leadership Election
            </h1>
            <p className="text-xs text-slate-400 leading-tight">Cast your vote &middot; 2026</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        {electionOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8 sm:mb-10 text-center"
            >
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight">
                Choose your next student representative
              </h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base mx-auto max-w-xl">
                Tap a candidate's card to review their platform, then confirm your vote.
                Each student can vote once.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 max-w-4xl mx-auto">
              {CANDIDATES.map((candidate, i) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={i}
                  onVote={setActiveCandidate}
                />
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-16 sm:mt-24 glow-ring glass rounded-2xl p-8 flex flex-col items-center text-center gap-3"
          >
            <div className="h-12 w-12 rounded-full bg-signal-gradient flex items-center justify-center shadow-glow">
              <LockKeyhole className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Voting is closed</h2>
            <p className="text-sm text-slate-400">{ELECTION_CLOSED_NOTICE}</p>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {activeCandidate && electionOpen && (
          <VoteModal
            candidate={activeCandidate}
            onClose={() => setActiveCandidate(null)}
            onVoteRecorded={handleVoteRecorded}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast icon={CheckCircle2} message={toast} />}
      </AnimatePresence>
    </div>
  );
}
