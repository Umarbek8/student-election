import { motion } from "framer-motion";
import { Vote } from "lucide-react";

export default function CandidateCard({ candidate, index, onVote }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="glow-ring glass rounded-2xl overflow-hidden flex flex-col h-full w-full mx-auto max-w-sm md:max-w-none"
    >
      <div className="relative overflow-hidden rounded-t-2xl h-56 sm:h-64">
        <motion.img
          src={candidate.image}
          alt={candidate.name}
          loading="lazy"
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-950/80 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full glass text-signal-cyan border border-signal-cyan/30">
          {candidate.grade}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3 text-center">
        <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
          {candidate.name}
        </h3>

        <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-400">
          Nomzod {candidate.number || candidate.grade}
        </p>

        <motion.button
          type="button"
          onClick={() => onVote(candidate)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-auto group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-signal-gradient bg-[length:200%_200%] animate-border-flow shadow-glow hover:shadow-glow-cyan transition-shadow w-full"
        >
          <Vote className="h-4 w-4" />
          Vote Now
        </motion.button>
      </div>
    </motion.article>
  );
}
