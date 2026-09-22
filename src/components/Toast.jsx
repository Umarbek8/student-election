import { motion } from "framer-motion";

export default function Toast({ icon: Icon, message, tone = "default" }) {
  const toneClasses =
    tone === "celebrate"
      ? "border-signal-gold/40 text-signal-gold"
      : "text-signal-cyan";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed left-1/2 bottom-6 z-[70] glow-ring glass rounded-xl px-4 py-3.5 flex items-center gap-2.5 shadow-glow max-w-sm"
    >
      {Icon && <Icon className={`h-5 w-5 shrink-0 ${toneClasses}`} />}
      <p className="text-sm text-white">{message}</p>
    </motion.div>
  );
}
