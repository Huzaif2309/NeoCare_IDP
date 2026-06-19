import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { 
  Activity, ShieldAlert, User, ArrowRight, ShieldCheck, HelpCircle, AlertTriangle, RefreshCw 
} from "lucide-react";
import Navbar from "./Navbar";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [infants, setInfants] = useState([]);

  // Aggregated Metric Counters State
  const [metrics, setMetrics] = useState({
    total: 0,
    healthy: 0,
    atRisk: 0,
    critical: 0,
    undetermined: 0
  });

  useEffect(() => {
    // Initial data fetch
    fetchGlobalAnalytics();

    // Poll fresh data from Supabase every 5 seconds
    const interval = setInterval(() => {
      fetchGlobalAnalytics(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchGlobalAnalytics = async (triggerLoader = true) => {
    try {
      if (triggerLoader) setLoading(true);

      const { data, error } = await supabase
        .from("infants")
        .select(`
          id,
          name,
          device_id,
          gender,
          infant_sensor_data (
            heart_rate_bpm,
            respiratory_rate_bpm,
            temperature_c,
            movement_index,
            recorded_at
          ),
          prediction_history (
            prediction_label,
            confidence,
            created_at
          )
        `);

      if (error) throw error;

      console.log("Supabase Fetch Result:", data);

      const processedInfants = (data || []).map(infant => {
        const predictionData = Array.isArray(infant.prediction_history)
          ? infant.prediction_history[0]
          : infant.prediction_history;

        let vitalsData = {};
        if (
          Array.isArray(infant.infant_sensor_data) &&
          infant.infant_sensor_data.length > 0
        ) {
          vitalsData = [...infant.infant_sensor_data]
            .sort(
              (a, b) =>
                new Date(b.recorded_at) -
                new Date(a.recorded_at)
            )[0];
        }

        return {
          ...infant,
          latest_prediction: predictionData || null,
          vitals: vitalsData || {}
        };
      });

      setInfants(processedInfants);
      calculateSummaryMetrics(processedInfants);
    } catch (err) {
      console.error("Analytics fetch transaction failure:", err.message);
    } finally {
      if (triggerLoader) setLoading(false);
    }
  };

  const calculateSummaryMetrics = (records) => {
    let totals = { total: records.length, healthy: 0, atRisk: 0, critical: 0, undetermined: 0 };

    records.forEach(infant => {
      if (!infant.latest_prediction) {
        totals.undetermined += 1;
      } else {
        const label = infant.latest_prediction.prediction_label?.toLowerCase().trim();
        if (label === "healthy" || label === "stable") totals.healthy += 1;
        else if (label === "at risk" || label === "moderate risk") totals.atRisk += 1;
        else if (label === "critical" || label === "high risk") totals.critical += 1;
        else totals.undetermined += 1;
      }
    });

    setMetrics(totals);
  };

  const highRiskRegistry = infants.filter(infant => {
    const label = infant.latest_prediction?.prediction_label?.toLowerCase().trim() || "";
    return label === "at risk" || label === "moderate risk" || label === "critical" || label === "high risk";
  });

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-black text-white pt-24 px-6 pb-12 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-[-200px] left-[-100px] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[160px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[160px]" />

        <main className="relative z-10 max-w-7xl mx-auto">
          {/* Header section */}
          <div className="border-b border-zinc-800/80 pb-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Core Analytics Terminal
              </h1>
              <p className="text-zinc-400 mt-1 text-sm font-mono uppercase text-cyan-500/80 tracking-widest">Live ML Classification Matrix overview</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-zinc-400">
              <RefreshCw className="h-3 w-3 text-cyan-500 animate-spin" /> Live IoT Cluster Sync Active
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 font-mono text-xs">
              <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span>COMPILING DYNAMIC REGISTRY SUMMARY METRICS...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* --- SECTION 1: STATS CARD ROW --- */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Active Beds</div>
                  <div className="text-3xl font-black text-white mt-1">{metrics.total}</div>
                  <User className="absolute bottom-2 right-2 h-8 w-8 text-zinc-800/60" />
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Healthy Status</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">{metrics.healthy}</div>
                  <ShieldCheck className="absolute bottom-2 right-2 h-8 w-8 text-emerald-950/40" />
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.02)]">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">At Risk Label</div>
                  <div className="text-3xl font-black text-amber-400 mt-1">{metrics.atRisk}</div>
                  <AlertTriangle className="absolute bottom-2 right-2 h-8 w-8 text-amber-950/40" />
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.02)]">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Critical Status</div>
                  <div className="text-3xl font-black text-rose-500 mt-1">{metrics.critical}</div>
                  <ShieldAlert className="absolute bottom-2 right-2 h-8 w-8 text-rose-950/40" />
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Undetermined</div>
                  <div className="text-3xl font-black text-zinc-400 mt-1">{metrics.undetermined}</div>
                  <HelpCircle className="absolute bottom-2 right-2 h-8 w-8 text-zinc-800/60" />
                </div>
              </div>

              {/* --- SECTION 2: HIGH RISK REGISTRY LIST --- */}
              <div className="border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-5 w-5 text-rose-500" /> High Priority Risk Registry
                </h3>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-6">Cross-matched database anomalies requiring immediate diagnostics</p>

                {highRiskRegistry.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm font-mono border border-dashed border-zinc-800 rounded-xl bg-black/20">
                    🎉 Zero anomalous data signatures logged inside ML pipeline tables. All systems nominal.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highRiskRegistry.map((infant) => {
                      const label = infant.latest_prediction?.prediction_label?.toLowerCase().trim() || "";
                      const isCritical = label === "critical" || label === "high risk";
                      
                      return (
                        <div key={infant.id} className={`p-5 rounded-xl border bg-black/40 font-mono transition relative flex flex-col justify-between gap-4 ${
                          isCritical ? "border-rose-500/30 hover:border-rose-500/50" : "border-amber-500/30 hover:border-amber-500/50"
                        }`}>
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-bold text-white">{infant.name}</h4>
                                <span className="text-[10px] text-zinc-500">{infant.device_id || "NO_DEV_ID"}</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${
                                isCritical ? "bg-rose-950/40 text-rose-400 border-rose-500/30" : "bg-amber-950/40 text-amber-400 border-amber-500/30"
                              }`}>
                                {infant.latest_prediction?.prediction_label} ({Math.floor((infant.latest_prediction?.confidence || 0) * 100)}%)
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/infant/${infant.id}`}
                            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-2 transition"
                          >
                            Open Critical Stream Channel <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* --- SECTION 3: SYSTEM GENERAL REGISTRY MONITOR --- */}
              <div className="border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" /> General Terminal Matrix Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Patient Profile</th>
                        <th className="pb-3">Hardware Node Key</th>
                        <th className="pb-3">Vitals Profile (HR / RR / Temp)</th>
                        <th className="pb-3 text-right pr-2">ML Pipeline Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {infants.map((infant) => {
                        const statusLabel = infant.latest_prediction?.prediction_label || "Undetermined";
                        const normalizedLabel = statusLabel.toLowerCase().trim();

                        return (
                          <tr key={infant.id} className="hover:bg-zinc-900/30 transition-colors group">
                            <td className="py-3.5 pl-2 font-bold text-white group-hover:text-cyan-400 transition">
                              <Link to={`/infant/${infant.id}`}>{infant.name}</Link>
                            </td>
                            <td className="py-3.5 text-zinc-400">{infant.device_id || "UNASSIGNED"}</td>
                            <td className="py-3.5 text-zinc-300">
                              {infant.vitals.heart_rate_bpm ? (
                                <span>
                                  {infant.vitals.heart_rate_bpm} bpm / <span className="text-cyan-400">{infant.vitals.respiratory_rate_bpm} rr</span> / <span className="text-orange-400">{infant.vitals.temperature_c}°C</span>
                                </span>
                              ) : (
                                <span className="text-zinc-600">Off-line</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right pr-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${
                                normalizedLabel === "healthy" || normalizedLabel === "stable" ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20" :
                                normalizedLabel === "at risk" || normalizedLabel === "moderate risk" ? "bg-amber-950/30 text-amber-400 border-amber-500/20" :
                                normalizedLabel === "critical" || normalizedLabel === "high risk" ? "bg-rose-950/30 text-rose-400 border-rose-500/20" :
                                "bg-zinc-900 text-zinc-500 border-zinc-800"
                              }`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </>
  );
}