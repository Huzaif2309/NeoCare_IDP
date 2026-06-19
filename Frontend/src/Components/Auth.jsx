import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Activity, Mail, Lock, User, Shield, Briefcase, Stethoscope, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userRole, setUserRole] = useState("caregiver");
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
const [experienceYears, setExperienceYears] = useState("");
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (isSignUp) {
        // 1. Sign Up in Supabase Auth (Will be instant now without verification)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              role: userRole 
            },
          },
        });

        if (error) throw error;

        // 2. Insert into PostgreSQL tables mapping identity profile
        if (data?.user) {
          if (userRole === "caregiver") {
            const { error: pgError } = await supabase
              .from("caregivers")
              .insert([
               {
                id: data.user.id,
                full_name: fullName,
                email: email,
                phone: phone,
                role: "caregiver",
                hospital_name: hospitalName,
                experience_years: Number(experienceYears)
              },
              ]);
            if (pgError) throw pgError;
          } else if (userRole === "doctor") {
            const { error: pgError } = await supabase
              .from("doctors")
              .insert([
                {
                id: data.user.id,
                full_name: fullName,
                email: email,
                phone: phone,
                specialization: specialization,
                hospital_name: hospitalName,
                years_experience: Number(experienceYears)
              },
              ]);
            if (pgError) throw pgError;
          }
        }

        // Clear values and switch to Sign In page state with dynamic success alert
        setIsSignUp(false);
        setPassword(""); // Clear password for security
        setMessage({ 
          type: "success", 
          text: "Registration successful! Account active. Please sign in below." 
        });

      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        navigate("/dashboard");
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center px-4 py-20">
        {/* Glow Ambient Shadows */}
        <div className="absolute top-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[150px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[150px]" />

        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)]">
          
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Activity className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Smart Neonatal Monitoring Portal Gateway
            </p>
          </div>

          {/* Role Selection Tabs (Only visible during Sign Up) */}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-black/60 rounded-xl border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setUserRole("caregiver")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  userRole === "caregiver"
                    ? "bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Caregiver
              </button>
              <button
                type="button"
                onClick={() => setUserRole("doctor")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  userRole === "doctor"
                    ? "bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                Doctor
              </button>
            </div>
          )}

          {/* Status Alert Messages */}
          {message.text && (
            <div className={`mb-5 p-3 rounded-lg text-sm border ${
              message.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                      placeholder={userRole === "doctor" ? "Dr. Name" : "Caregiver Name"}
                    />
                  </div>
                </div>
                <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Phone Number
                </label>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />

                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                    placeholder="9876543210"
                  />
                </div>
              </div>

                {/* Specialization (Only for Doctors) */}
                {userRole === "doctor" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Specialization</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                        placeholder="e.g. Neonatologist"
                      />
                    </div>
                  </div>
                )}

                {/* Hospital Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Hospital Facility Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                      placeholder="e.g. Rainbow Children Hospital"
                    />
                  </div>
                </div>
                <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Years Of Experience
                </label>

                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />

                  <input
                    type="number"
                    required
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                    placeholder="5"
                  />
                </div>
              </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                  placeholder="name@medical-center.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition duration-200 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                `Register as ${userRole === "doctor" ? "Doctor" : "Caregiver"}`
              ) : (
                "Sign In Portal"
              )}
            </button>
          </form>

          {/* Toggle Screen Mode Links */}
          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-500">
              {isSignUp ? "Already have an account? " : "New to NeoCare AI? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage({ type: "", text: "" });
              }}
              className="text-cyan-400 font-medium hover:underline focus:outline-none bg-transparent border-none p-0 cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Create medical access"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}