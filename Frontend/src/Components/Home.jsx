import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import Navbar from "./Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-black">

        {/* Glow Effects */}
        <div className="absolute top-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[150px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]" />

        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">

          <div className="mb-8 p-5 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            <Activity className="h-14 w-14 text-cyan-400" />
          </div>

          <h1 className="text-6xl font-bold text-white tracking-tight">
            NeoCare AI
          </h1>

          <p className="mt-4 text-xl text-blue-300 font-medium">
            Stay hungry, stay foolish
          </p>

          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Smart Neonatal Monitoring System. Real-time vital tracking,
            AI anomaly detection, and unified caregiver alerts.
          </p>

          <Link
            to="/dashboard"
            className="mt-10 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            Go to Dashboard
          </Link>

        </main>
      </div>
    </>
  );
}