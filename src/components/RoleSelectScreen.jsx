import { motion } from "framer-motion";
import { GraduationCap, Landmark, ArrowRight, Vote } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeOut" },
  }),
};

function RoleCard({ icon: Icon, eyebrow, title, description, cta, onClick, index }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="glow-ring glass rounded-2xl p-7 sm:p-9 flex flex-col items-start text-left gap-4 flex-1"
    >
      <div className="h-12 w-12 rounded-xl bg-signal-gradient flex items-center justify-center shadow-glow">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-signal-cyan font-medium">{eyebrow}</p>
        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mt-1">{title}</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

export default function RoleSelectScreen({ onSelectStudent, onSelectAdmin }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center gap-3 mb-10 sm:mb-14"
      >
        <div className="h-11 w-11 rounded-lg bg-signal-gradient flex items-center justify-center shadow-glow">
          <Vote className="h-5 w-5 text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
          Student Leadership Election
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md">
          Choose how you'd like to continue.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 w-full max-w-3xl">
        <RoleCard
          index={0}
          icon={GraduationCap}
          eyebrow="Voter access"
          title="Student"
          description="View the candidates and cast your vote from this device."
          cta="Continue to voting"
          onClick={onSelectStudent}
        />
        <RoleCard
          index={1}
          icon={Landmark}
          eyebrow="Executive access"
          title="School Leadership"
          description="Sign in to monitor live results and manage the election."
          cta="Sign in"
          onClick={onSelectAdmin}
        />
      </div>
    </div>
  );
}
