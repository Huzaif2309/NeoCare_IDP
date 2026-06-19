import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    // Get initial session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state alterations
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/80 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        
        {/* Brand Link */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] group-hover:border-cyan-500/30">
            <Activity className="h-full w-full text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-400 transition-all duration-300">
            NeoCare <span className="text-cyan-400 font-extrabold">AI</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5">
            <Link to="/" className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive("/") ? "text-cyan-400 bg-zinc-900/80 border border-zinc-800" : "text-zinc-400 hover:text-white"}`}>
              Home
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive("/dashboard") ? "text-cyan-400 bg-zinc-900/80 border border-zinc-800" : "text-zinc-400 hover:text-white"}`}>
                  Dashboard
                </Link>
                <Link to="/analytics" className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive("/analytics") ? "text-cyan-400 bg-zinc-900/80 border border-zinc-800" : "text-zinc-400 hover:text-white"}`}>
                  Analytics
                </Link>
              </>
            )}
          </nav>

          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-400 bg-zinc-900 border border-zinc-800/80 rounded-xl transition-all duration-300 hover:bg-rose-950/20 hover:border-rose-500/30 shadow-md"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700"
            >
              Sign In / Register
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}