import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ArrowRight } from "lucide-react";
import { ADMIN_PASSWORD } from "../constants";

export default function AdminPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-base-950/80 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.form
        key={shakeKey}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={
          error
            ? { opacity: 1, scale: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }
            : { opacity: 1, scale: 1, x: 0 }
        }
        transition={error ? { duration: 0.5, ease: "easeInOut" } : { duration: 0.25 }}
        className="glow-ring glass w-full max-w-sm rounded-2xl p-7 flex flex-col items-center text-center gap-3 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-11 w-11 rounded-full bg-signal-gradient flex items-center justify-center shadow-glow">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <h2 className="font-display font-bold text-lg text-white">School Leadership sign-in</h2>
        <p className="text-sm text-slate-400 -mt-1">
          Enter the master password to open the executive dashboard.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Master password"
          className="w-full rounded-lg bg-base-900/80 border border-slate-700 focus:border-signal-cyan focus:ring-2 focus:ring-signal-cyan/30 outline-none px-3.5 py-2.5 text-white placeholder:text-slate-500 mt-2 text-center"
        />

        {error && <p className="text-sm text-red-400">Invalid Password.</p>}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-semibold text-sm text-white bg-signal-gradient shadow-glow"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
