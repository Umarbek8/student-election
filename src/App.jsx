import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RoleSelectScreen from "./components/RoleSelectScreen";
import StudentView from "./components/StudentView";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import AdminPasswordModal from "./components/AdminPasswordModal";
import { ADMIN_GREETING } from "./constants";

export default function App() {
  const [view, setView] = useState("role"); // "role" | "student" | "dashboard"
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [greeting, setGreeting] = useState(null);

  const handleAdminSuccess = () => {
    setShowPasswordModal(false);
    setGreeting(ADMIN_GREETING);
    window.setTimeout(() => {
      setGreeting(null);
      setView("dashboard");
    }, 3000);
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {view === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <RoleSelectScreen
              onSelectStudent={() => setView("student")}
              onSelectAdmin={() => setShowPasswordModal(true)}
            />
          </motion.div>
        )}

        {view === "student" && (
          <motion.div
            key="student"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StudentView onBack={() => setView("role")} />
          </motion.div>
        )}

        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ExecutiveDashboard onLogout={() => setView("role")} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <AdminPasswordModal
            onClose={() => setShowPasswordModal(false)}
            onSuccess={handleAdminSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {greeting && (
          <motion.div
            key="admin-greeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[80] bg-base-950/80 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 px-6 py-8 sm:px-10 sm:py-12 text-center shadow-2xl"
            >
              <p className="font-display font-bold text-2xl sm:text-4xl md:text-5xl leading-tight text-white tracking-tight">
                {greeting}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
