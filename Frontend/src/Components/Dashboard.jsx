import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Activity, ShieldAlert, Heart, Thermometer, Droplet, User,
  ArrowRight, Lock, Plus, Wind, Move, Stethoscope, UserCheck, Calendar
} from "lucide-react";
import Navbar from "./Navbar";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [infants, setInfants] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
        fetchInfantTelemetry();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const checkUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("caregivers")
        .select("id")
        .eq("id", userId)
        .single();
      if (data && !error) setIsCaretaker(true);
    } catch (err) {
      console.error("Role verification failed:", err.message);
    }
  };

  const fetchInfantTelemetry = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("infants")
        .select(`
          id,
          name,
          gender,
          dob,
          gestational_age_weeks,
          birth_weight_kg,
          birth_length_cm,
          birth_head_circumference_cm,
          blood_type,
          medical_history,
          device_id,
          created_at,
          doctors (
            id,
            full_name,
            email,
            specialization
          ),
          caregivers (
            id,
            full_name,
            email,
            role
          ),
          infant_sensor_data (
            temperature_c,
            heart_rate_bpm,
            respiratory_rate_bpm,
            movement_index,
            recorded_at
          ),
          prediction_history (
            prediction_label,
            confidence,
            created_at
          )
        `)
        .order("recorded_at", { referencedTable: "infant_sensor_data", ascending: false })
        .order("created_at", { referencedTable: "prediction_history", ascending: false });

      if (error) throw error;
      setInfants(data || []);
    } catch (err) {
      console.error("Telemetry collection exception:", err.message);
    } finally {
      loading && setLoading(false);
    }
  };

  // Format date of birth
  const formatDOB = (dob) => {
    if (!dob) return "---";
    return new Date(dob).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  // Get prediction badge styling (Supports High, Moderate, Low Risk, Healthy, or Stable)
  const getPredictionStyle = (label) => {
    const formattedLabel = label?.toLowerCase().trim();
    switch (formattedLabel) {
      case "high risk":
      case "critical":
        return "bg-rose-950/30 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
      case "moderate risk":
      case "at risk":
        return "bg-amber-950/30 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
      case "low risk":
      case "healthy":
      case "stable":
        return "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
      default:
        return "bg-zinc-800/40 border-zinc-600/40 text-zinc-400";
    }
  };

  // Unauthenticated view
  if (!loading && !session) {
    return (
      <>
        <Navbar />
        <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
          <div className="absolute top-[-100px] h-[400px] w-[400px] rounded-full bg-rose-600/10 blur-[120px]" />
          <div className="relative z-10 max-w-sm p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-xl border-rose-500/20">
            <div className="mb-4 inline-flex p-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <Lock className="h-7 w-7 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Access Denied</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              This terminal requires active biometric or identity session clearance token keys. Please pass credentials authentication portal first.
            </p>
            <Link
              to="/auth"
              className="mt-6 block w-full text-center py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-cyan-400 transition-all duration-200"
            >
              Go to Authentication Portal
            </Link>
          </div>
        </div>
      </>
    );
  }

  // UPDATED: Stable filter handling structural variants safely
  const stableCount = infants.filter((i) => {
    const p = Array.isArray(i.prediction_history)
      ? i.prediction_history[0]
      : i.prediction_history;

    return p?.prediction_label !== "High Risk";
  }).length;

  // UPDATED: High Risk filter handling structural variants safely
  const highRiskCount = infants.filter((i) => {
    const p = Array.isArray(i.prediction_history)
      ? i.prediction_history[0]
      : i.prediction_history;

    return p?.prediction_label === "High Risk";
  }).length;

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-black text-white pt-24 px-6 pb-12 overflow-hidden">
        <div className="absolute top-[-200px] left-[-100px] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[160px]" />

        <main className="relative z-10 max-w-7xl mx-auto">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                System Diagnostics{" "}
                <span className="text-sm font-mono px-2.5 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 tracking-wider uppercase animate-pulse">
                  Live link active
                </span>
              </h1>
              <p className="text-zinc-400 mt-1 text-sm">Centralized Neonatal Intelligent System Registry Overview</p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {isCaretaker && (
                <Link
                  to="/add-infant"
                  className="flex items-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-bold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.25)] mr-2"
                >
                  <Plus className="h-4 w-4 stroke-[3]" /> Add New Infant
                </Link>
              )}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-center min-w-[90px]">
                <div className="text-2xl font-bold text-cyan-400">{infants.length}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-0.5">Active Beds</div>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-center min-w-[90px]">
                <div className="text-2xl font-bold text-emerald-400">{stableCount}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-0.5">Stable</div>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-center min-w-[90px]">
                <div className="text-2xl font-bold text-rose-400">{highRiskCount}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-0.5">High Risk</div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span className="text-xs font-mono tracking-widest uppercase">Fetching Telemetry Arrays...</span>
            </div>
          ) : infants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Activity className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-mono text-sm">No infant records found in system registry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {infants.map((infant) => {
                let latestSensor = {};
                if (infant.infant_sensor_data) {
                  if (Array.isArray(infant.infant_sensor_data)) {
                    const sorted = [...infant.infant_sensor_data].sort(
                      (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
                    );
                    latestSensor = sorted[0] || {};
                  } else {
                    latestSensor = infant.infant_sensor_data;
                  }
                }

                // UPDATED: Custom structured field extraction logic block
                const prediction = Array.isArray(infant.prediction_history)
                  ? infant.prediction_history[0]
                  : infant.prediction_history || {
                      prediction_label: "Undetermined",
                      confidence: null
                    };

                const doctor = infant.doctors || null;
                const caregiver = infant.caregivers || null;

                return (
                  <div
                    key={infant.id}
                    className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl p-5 transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col justify-between"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition duration-200 leading-tight">
                              {infant.name}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {infant.device_id || "NO_DEV_ID"}
                            </span>
                          </div>
                        </div>

                        {/* Risk Badge (Confidence Hidden) */}
                        <span className={`text-[10px] font-mono px-2 py-1 rounded-md uppercase font-bold border tracking-wider ${getPredictionStyle(prediction?.prediction_label)}`}>
                          {prediction?.prediction_label || "Undetermined"}
                        </span>
                      </div>

                      {/* Identity Row: Gender, DOB */}
                      <div className="flex items-center gap-3 mb-3 text-xs font-mono text-zinc-400">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-zinc-600" />
                          <span>{infant.gender || "---"}</span>
                        </div>
                        <span className="text-zinc-700">|</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-600" />
                          <span>{formatDOB(infant.dob)}</span>
                        </div>
                        {infant.gestational_age_weeks && (
                          <>
                            <span className="text-zinc-700">|</span>
                            <span>{infant.gestational_age_weeks}w GA</span>
                          </>
                        )}
                      </div>

                      {/* Sensor Vitals Strip */}
                      <div className="grid grid-cols-4 gap-1.5 my-3 bg-black/40 p-3 rounded-xl border border-zinc-800/60 font-mono">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-[9px] text-zinc-500 mb-0.5">
                            <Heart className="h-2.5 w-2.5 text-rose-500" /> HR
                          </div>
                          <div className="text-xs font-bold text-zinc-200">
                            {latestSensor.heart_rate_bpm ? `${latestSensor.heart_rate_bpm}` : "---"}
                          </div>
                          <div className="text-[8px] text-zinc-600">bpm</div>
                        </div>
                        <div className="text-center border-x border-zinc-800/60">
                          <div className="flex items-center justify-center gap-0.5 text-[9px] text-zinc-500 mb-0.5">
                            <Thermometer className="h-2.5 w-2.5 text-orange-400" /> Temp
                          </div>
                          <div className="text-xs font-bold text-zinc-200">
                            {latestSensor.temperature_c ? `${latestSensor.temperature_c}` : "---"}
                          </div>
                          <div className="text-[8px] text-zinc-600">°C</div>
                        </div>
                        <div className="text-center border-r border-zinc-800/60">
                          <div className="flex items-center justify-center gap-0.5 text-[9px] text-zinc-500 mb-0.5">
                            <Wind className="h-2.5 w-2.5 text-blue-400" /> RR
                          </div>
                          <div className="text-xs font-bold text-zinc-200">
                            {latestSensor.respiratory_rate_bpm ? `${latestSensor.respiratory_rate_bpm}` : "---"}
                          </div>
                          <div className="text-[8px] text-zinc-600">brpm</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5 text-[9px] text-zinc-500 mb-0.5">
                            <Move className="h-2.5 w-2.5 text-purple-400" /> MOV
                          </div>
                          <div className="text-xs font-bold text-zinc-200">
                            {latestSensor.movement_index != null ? `${latestSensor.movement_index}` : "---"}
                          </div>
                          <div className="text-[8px] text-zinc-600">idx</div>
                        </div>
                      </div>

                      {/* Doctor & Caregiver */}
                      <div className="space-y-1.5 mt-3">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-1 text-zinc-600 shrink-0">
                            <Stethoscope className="h-3 w-3 text-cyan-600" />
                            <span className="text-zinc-500 uppercase text-[9px] tracking-wider">Dr</span>
                          </div>
                          {doctor ? (
                            <span className="text-zinc-300 truncate">
                              {doctor.full_name}
                              <span className="text-zinc-600 ml-1 text-[9px]">{doctor.email}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic">Unassigned</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-1 text-zinc-600 shrink-0">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            <span className="text-zinc-500 uppercase text-[9px] tracking-wider">CG</span>
                          </div>
                          {caregiver ? (
                            <span className="text-zinc-300 truncate">
                              {caregiver.full_name}
                              <span className="text-zinc-600 ml-1 text-[9px]">{caregiver.email}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Open Telemetry Button */}
                    <Link
                      to={`/infant/${infant.id}`}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white transition-all duration-300"
                    >
                      Open Telemetry Channel
                      <ArrowRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}