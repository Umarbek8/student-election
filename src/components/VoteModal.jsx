import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { GRADE_OPTIONS } from "../data/candidates";
import { castVote, hasAlreadyVoted } from "../firebase";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.97 },
};

export default function VoteModal({ candidate, onClose, onVoteRecorded }) {
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [errorMessage, setErrorMessage] = useState("");

  if (!candidate) return null;

  const resetForm = () => {
    setFullName("");
    setGrade("");
    setStatus("idle");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !grade) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const alreadyVoted = await hasAlreadyVoted(fullName, grade);
      if (alreadyVoted) {
        setStatus("error");
        setErrorMessage("This student has already voted. Only one vote per person.");
        return;
      }

      await castVote({
        studentName: fullName,
        grade,
        candidateId: candidate.id,
        candidateName: candidate.name,
      });

      onVoteRecorded(candidate);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Something went wrong recording your vote. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-base-950/70 backdrop-blur-sm px-4 py-6"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="glow-ring glass w-full max-w-md rounded-2xl p-6 sm:p-7 relative"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-xs text-signal-cyan font-medium">Confirm your ballot</p>
          <h2 className="font-display font-bold text-xl text-white mt-1">
            Voting for {candidate.name}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your details below to cast one vote. This only takes a moment.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm text-slate-300">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full rounded-lg bg-base-900/80 border border-slate-700 focus:border-signal-cyan focus:ring-2 focus:ring-signal-cyan/30 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="grade" className="text-sm text-slate-300">
                Grade / class
              </label>
              <select
                id="grade"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-lg bg-base-900/80 border border-slate-700 focus:border-signal-cyan focus:ring-2 focus:ring-signal-cyan/30 outline-none px-3.5 py-2.5 text-sm text-white transition-colors"
              >
                <option value="" disabled>
                  Select your grade
                </option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-sm text-red-300"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={status === "submitting"}
              whileHover={{ scale: status === "submitting" ? 1 : 1.02 }}
              whileTap={{ scale: status === "submitting" ? 1 : 0.97 }}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-signal-gradient bg-[length:200%_200%] animate-border-flow shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording your vote...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm My Vote
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
