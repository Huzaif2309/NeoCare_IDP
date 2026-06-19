import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { 
  Activity, User, Settings, Lock, Save, 
  ArrowLeft, RefreshCw, AlertCircle, Eye 
} from "lucide-react";
import Navbar from "./Navbar";

export default function InfantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sensorIntervalRef = useRef(null);

  // System & Authorization States
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [noVitalsFound, setNoVitalsFound] = useState(false);

  // Core Database Schema States
  const [infant, setInfant] = useState(null);
  
  // Caregiver daily records / Clinical metrics state (public.infant_vitals)
  const [manualFields, setManualFields] = useState({
    age_days: 0,
    weight_kg: "",
    length_cm: "",
    head_circumference_cm: "",
    feeding_type: "Breastfeeding",
    feeding_frequency_per_day: "",
    urine_output_count: "",
    stool_count: "",
    jaundice_level_mg_dl: "",
    apgar_score: "",
    immunizations_done: "No",
    reflexes_normal: "Yes",
    medical_history: "" 
  });

  // Real-time IoT Sensor streams (public.infant_sensor_data)
  const [sensorFields, setSensorFields] = useState({
    heart_rate_bpm: null,
    respiratory_rate_bpm: null,
    temperature_c: null,
    movement_index: null
  });

  useEffect(() => {
    // Validate Auth Identity Clearance
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const userRole = session.user.user_metadata?.role || "";
        setIsCaregiver(userRole.toLowerCase() === "caregiver"); 
        fetchInfantRecord();
      } else {
        setLoading(false);
      }
    });

    // REAL-TIME DATABASE POLLING ENGINE: Fetches latest telemetry metrics every 5 seconds
    sensorIntervalRef.current = setInterval(async () => {
      if (!id) return;

      try {
        // Fetch the absolute latest sensor log entry for this infant from the DB
        const { data, error } = await supabase
          .from("infant_sensor_data")
          .select("heart_rate_bpm, respiratory_rate_bpm, temperature_c, movement_index")
          .eq("infant_id", id)
          .order("recorded_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        // If a record exists, update the localized viewport with the real-time sensor metrics
        if (data && data.length > 0) {
          const latestSensor = data[0];
          setSensorFields({
            heart_rate_bpm: latestSensor.heart_rate_bpm,
            respiratory_rate_bpm: latestSensor.respiratory_rate_bpm,
            temperature_c: latestSensor.temperature_c,
            movement_index: latestSensor.movement_index
          });
        }
        
      } catch (err) {
        console.error("Database telemetry polling transaction fault:", err.message);
      }
    }, 5000);

    return () => {
      if (sensorIntervalRef.current) clearInterval(sensorIntervalRef.current);
    };
  }, [id]);
  
  const fetchInfantRecord = async () => {
    try {
      setLoading(true);
      
      // Perform nested structural join across the split tables
      const { data, error } = await supabase
        .from("infants")
        .select(`
          *,
          infant_vitals ( * ),
          infant_sensor_data (
            temperature_c,
            heart_rate_bpm,
            respiratory_rate_bpm,
            movement_index,
            recorded_at
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setInfant(data);
        
        // Extract clinical vitals object row
        const vitalsRow = data.infant_vitals?.[0] || data.infant_vitals; 

        // Extract the absolute latest sensor telemetry stream sequence item
        let latestSensor = null;
        if (data.infant_sensor_data && data.infant_sensor_data.length > 0) {
          latestSensor = data.infant_sensor_data.reduce((latest, current) => {
            return new Date(current.recorded_at) > new Date(latest.recorded_at) ? current : latest;
          }, data.infant_sensor_data[0]);
        }

        if (latestSensor) {
          setSensorFields({
            heart_rate_bpm: latestSensor.heart_rate_bpm,
            respiratory_rate_bpm: latestSensor.respiratory_rate_bpm,
            temperature_c: latestSensor.temperature_c,
            movement_index: latestSensor.movement_index
          });
        }

        if (!vitalsRow) {
          setNoVitalsFound(true);
          setManualFields(prev => ({
            ...prev,
            medical_history: data.medical_history || ""
          }));
        } else {
          setNoVitalsFound(false);
          setManualFields({
            age_days: vitalsRow.age_days ?? 0,
            weight_kg: vitalsRow.weight_kg ?? "",
            length_cm: vitalsRow.length_cm ?? "",
            head_circumference_cm: vitalsRow.head_circumference_cm ?? "",
            feeding_type: vitalsRow.feeding_type || "Breastfeeding",
            feeding_frequency_per_day: vitalsRow.feeding_frequency_per_day ?? "",
            urine_output_count: vitalsRow.urine_output_count ?? "",
            stool_count: vitalsRow.stool_count ?? "",
            jaundice_level_mg_dl: vitalsRow.jaundice_level_mg_dl ?? "",
            apgar_score: vitalsRow.apgar_score ?? "",
            immunizations_done: vitalsRow.immunizations_done || "No",
            reflexes_normal: vitalsRow.reflexes_normal || "Yes",
            medical_history: data.medical_history || ""
          });
        }
      }
    } catch (err) {
      console.error("Profile core extraction fault:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFieldChange = (e) => {
    const { name, value } = e.target;
    setManualFields(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!isCaregiver) return;
    setStatusMsg("");

    try {
      // 1. Update static base diagnostics parent metrics
      const { error: infantUpdateError } = await supabase
        .from("infants")
        .update({
          medical_history: manualFields.medical_history,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (infantUpdateError) throw infantUpdateError;

      // 2. Build mapping object strictly targeting manual growth/clinical fields
      const vitalsPayload = {
        infant_id: id,
        age_days: manualFields.age_days ? parseInt(manualFields.age_days) : 0,
        weight_kg: manualFields.weight_kg !== "" ? parseFloat(manualFields.weight_kg) : null,
        length_cm: manualFields.length_cm !== "" ? parseFloat(manualFields.length_cm) : null,
        head_circumference_cm: manualFields.head_circumference_cm !== "" ? parseFloat(manualFields.head_circumference_cm) : null,
        feeding_type: manualFields.feeding_type,
        feeding_frequency_per_day: manualFields.feeding_frequency_per_day ? parseInt(manualFields.feeding_frequency_per_day) : null,
        urine_output_count: manualFields.urine_output_count ? parseInt(manualFields.urine_output_count) : null,
        stool_count: manualFields.stool_count ? parseInt(manualFields.stool_count) : null,
        jaundice_level_mg_dl: manualFields.jaundice_level_mg_dl !== "" ? parseFloat(manualFields.jaundice_level_mg_dl) : null,
        apgar_score: manualFields.apgar_score !== "" ? parseFloat(manualFields.apgar_score) : null,
        immunizations_done: manualFields.immunizations_done,
        reflexes_normal: manualFields.reflexes_normal,
        updated_at: new Date().toISOString()
      };

      const { error: vitalsUpsertError } = await supabase
        .from("infant_vitals")
        .upsert([vitalsPayload], { onConflict: 'infant_id' });

      if (vitalsUpsertError) throw vitalsUpsertError;
      
      setStatusMsg("Patient records safely synced and updated in the database.");
      setEditMode(false);
      fetchInfantRecord();
    } catch (err) {
      console.error("Database mutation failure:", err.message);
    }
  };

  if (!loading && !session) {
    return (
      <>
        <Navbar />
        <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
          <div className="relative z-10 max-w-sm p-8 rounded-2xl border border-rose-500/20 bg-zinc-900/30 backdrop-blur-xl">
            <Lock className="h-7 w-7 text-rose-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">Security Block</h3>
            <p className="mt-2 text-sm text-zinc-400">Please establish auth identity trace arrays prior to targeting biometric telemetry frames.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-black text-white pt-24 px-6 pb-12 overflow-hidden">
        <div className="absolute top-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]" />

        {infant && (
          <main className="relative z-10 max-w-6xl mx-auto">
            {/* Nav Back Header */}
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-zinc-500 hover:text-cyan-400 transition mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Master Dashboard
            </button>

            {/* Identity Profile Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* LEFT COLUMN: STATIC BIO MATRIX PROFILE */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl flex flex-col items-center text-center h-fit">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.15)] mb-4">
                  <User className="h-10 w-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{infant.name}</h2>
                <span className="text-xs text-zinc-500 font-mono mt-0.5">{infant.device_id || "UNASSIGNED_NODE"}</span>

                <div className="w-full border-t border-zinc-800/80 my-4 pt-4 space-y-3.5 text-left text-xs font-mono text-zinc-400">
                  <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 font-bold">AGE INDEX:</span> 
                    <span className="text-cyan-400 font-black px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 font-mono">
                      {noVitalsFound ? "---" : `${manualFields.age_days} DAYS`}
                    </span>
                  </div>
                  <div><span className="text-zinc-600 font-bold">Biological Gender:</span> {infant.gender}</div>
                  <div><span className="text-zinc-600 font-bold">Base Gestation:</span> {infant.gestational_age_weeks} Weeks</div>
                  <div><span className="text-zinc-600 font-bold">Blood Group:</span> {infant.blood_type || "A+"}</div>
                </div>

                {isCaregiver ? (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition duration-200 border ${
                      editMode 
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40" 
                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-cyan-400"
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    {editMode ? "CANCEL ACCESS" : "OPEN DAILY LOG FORM"}
                  </button>
                ) : (
                  <div className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs bg-zinc-950 text-zinc-600 border border-zinc-900/40 select-none font-mono">
                    <Lock className="h-3.5 w-3.5 text-zinc-700" /> READ-ONLY PRIVILEGES
                  </div>
                )}
              </div>

              {/* RIGHT COLUMNS: TELEMETRY DISPLAY & CONFIG FORMS */}
              <div className="lg:col-span-3 space-y-6">
                
                {statusMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                    {statusMsg}
                  </div>
                )}

                {noVitalsFound && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-400 font-mono">No Baseline Vitals Found</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        This patient is newly added to the registry. Real-time sensor parameters will stream below. Please use the daily configuration form to initiate baseline growth matrices.
                      </p>
                    </div>
                  </div>
                )}

                {/* SECTOR 1: IoT TELEMETRY HARDWARE ROW */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-pulse text-rose-500" /> Live IoT Sensor Telemetry Array
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400">
                      <RefreshCw className="h-3 w-3 text-cyan-500 animate-spin" /> 5s Cloud Sync
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                    <div className="p-3.5 bg-black/50 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Heart Rate</div>
                      <div className="text-2xl font-black text-rose-400 tracking-tight">
                        {sensorFields.heart_rate_bpm ? `${sensorFields.heart_rate_bpm} bpm` : "---"}
                      </div>
                      <div className="text-[9px] text-zinc-600 mt-1">MAX30102</div>
                    </div>
                    <div className="p-3.5 bg-black/50 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Respiratory Rate</div>
                      <div className="text-2xl font-black text-emerald-400 tracking-tight">
                        {sensorFields.respiratory_rate_bpm ? `${sensorFields.respiratory_rate_bpm} /m` : "---"}
                      </div>
                      <div className="text-[9px] text-zinc-600 mt-1">Chest IMU</div>
                    </div>
                    <div className="p-3.5 bg-black/50 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Core Skin Temp</div>
                      <div className="text-2xl font-black text-orange-400 tracking-tight">
                        {sensorFields.temperature_c ? `${sensorFields.temperature_c}°C` : "---"}
                      </div>
                      <div className="text-[9px] text-zinc-600 mt-1">MLX90614</div>
                    </div>
                    <div className="p-3.5 bg-black/50 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Movement Index</div>
                      <div className="text-2xl font-black text-cyan-400 tracking-tight">
                        {sensorFields.movement_index !== null ? `${sensorFields.movement_index}` : "---"}
                      </div>
                      <div className="text-[9px] text-zinc-600 mt-1">Accelerometer</div>
                    </div>
                  </div>
                </div>

                {/* SECTOR 2: CONFIGURATION & DIAGNOSTICS */}
                {editMode && isCaregiver ? (
                  <form onSubmit={handleUpdateRecord} className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/40 backdrop-blur-xl space-y-6">
                    <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-cyan-400" /> Daily Caregiver Configuration Form
                      </h3>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 mb-3 tracking-widest border-l-2 border-cyan-500 pl-2">1. Growth Matrix Metrics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Age (Days)</label>
                          <input type="number" name="age_days" value={manualFields.age_days} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Weight (kg)</label>
                          <input type="number" step="0.01" name="weight_kg" value={manualFields.weight_kg} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Length (cm)</label>
                          <input type="number" step="0.1" name="length_cm" value={manualFields.length_cm} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Head Circ (cm)</label>
                          <input type="number" step="0.1" name="head_circumference_cm" value={manualFields.head_circumference_cm} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 mb-3 tracking-widest border-l-2 border-blue-500 pl-2">2. Feeding & Metabolic Data Logs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Feeding Regimen</label>
                          <select name="feeding_type" value={manualFields.feeding_type} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none">
                            <option value="Breastfeeding">Breastfeeding</option>
                            <option value="Formula">Formula Base</option>
                            <option value="Mixed">Mixed Proportions</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Feeds / Day</label>
                          <input type="number" name="feeding_frequency_per_day" value={manualFields.feeding_frequency_per_day} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 mb-3 tracking-widest border-l-2 border-amber-500 pl-2">3. Excretory Tracking</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Urine Output Count</label>
                          <input type="number" name="urine_output_count" value={manualFields.urine_output_count} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Stool Log Frequency</label>
                          <input type="number" name="stool_count" value={manualFields.stool_count} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 mb-3 tracking-widest border-l-2 border-emerald-500 pl-2">4. Clinical Lab Diagnostics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Jaundice (mg/dL)</label>
                          <input type="number" step="0.1" name="jaundice_level_mg_dl" value={manualFields.jaundice_level_mg_dl} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Immunizations</label>
                          <select name="immunizations_done" value={manualFields.immunizations_done} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Normal Reflexes</label>
                          <select name="reflexes_normal" value={manualFields.reflexes_normal} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">APGAR Score</label>
                          <input type="number" name="apgar_score" min="0" max="10" step="0.1" value={manualFields.apgar_score} onChange={handleManualFieldChange} className="w-full p-2 bg-black text-white border border-zinc-800 rounded-lg text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 mb-3 tracking-widest border-l-2 border-purple-500 pl-2">5. Clinical Observations</h4>
                      <textarea rows="3" name="medical_history" value={manualFields.medical_history} onChange={handleManualFieldChange} className="w-full p-3 bg-black text-white border border-zinc-800 rounded-xl text-sm font-mono focus:border-cyan-500 focus:outline-none resize-none" placeholder="Enter baseline observations..." />
                    </div>

                    <button type="submit" className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-bold font-mono text-black flex items-center justify-center gap-2 text-xs transition duration-200 uppercase tracking-widest">
                      <Save className="h-4 w-4 stroke-[2.5]" /> Save & Update Metrics
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-xl">
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-4">
                        <Eye className="h-4 w-4 text-cyan-400" /> Cataloged Baseline Diagnostics Frame
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                        <div className="bg-black/40 border border-zinc-800/80 p-4 rounded-xl space-y-2">
                          <div className="text-cyan-400 font-bold border-b border-zinc-800 pb-1 uppercase text-[10px] tracking-wider">Growth Parameters</div>
                          <div className="flex justify-between"><span>Weight Status:</span> <span className="text-zinc-200 font-bold">{manualFields.weight_kg ? `${manualFields.weight_kg} kg` : "---"}</span></div>
                          <div className="flex justify-between"><span>Body Length:</span> <span className="text-zinc-200 font-bold">{manualFields.length_cm ? `${manualFields.length_cm} cm` : "---"}</span></div>
                          <div className="flex justify-between"><span>Head Circumference:</span> <span className="text-zinc-200 font-bold">{manualFields.head_circumference_cm ? `${manualFields.head_circumference_cm} cm` : "---"}</span></div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800/80 p-4 rounded-xl space-y-2">
                          <div className="text-blue-400 font-bold border-b border-zinc-800 pb-1 uppercase text-[10px] tracking-wider">Metabolic & Excretory</div>
                          <div className="flex justify-between"><span>Feeding Matrix:</span> <span className="text-zinc-200 font-bold">{manualFields.feeding_type}</span></div>
                          <div className="flex justify-between"><span>Frequency Array:</span> <span className="text-zinc-200 font-bold">{manualFields.feeding_frequency_per_day ? `${manualFields.feeding_frequency_per_day} feeds/day` : "---"}</span></div>
                          <div className="flex justify-between"><span>Excretory Counter:</span> <span className="text-zinc-200 font-bold">Urine: {manualFields.urine_output_count || "---"} | Stool: {manualFields.stool_count || "---"}</span></div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800/80 p-4 rounded-xl space-y-2 md:col-span-2">
                          <div className="text-emerald-400 font-bold border-b border-zinc-800 pb-1 uppercase text-[10px] tracking-wider">Clinical Summary Metrics</div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                            <div><span className="text-zinc-500">Bilirubin:</span> <span className="text-zinc-200 font-bold block mt-0.5">{manualFields.jaundice_level_mg_dl ? `${manualFields.jaundice_level_mg_dl} mg/dL` : "---"}</span></div>
                            <div><span className="text-zinc-500">Immunization:</span> <span className="text-zinc-200 font-bold block mt-0.5">{manualFields.immunizations_done}</span></div>
                            <div><span className="text-zinc-500">Reflex Assessment:</span> <span className="text-zinc-200 font-bold block mt-0.5">{manualFields.reflexes_normal}</span></div>
                            <div><span className="text-zinc-500">APGAR Index:</span> <span className="text-emerald-400 font-black block mt-0.5 bg-emerald-950/40 border border-emerald-500/20 w-fit px-2 py-0.5 rounded">{manualFields.apgar_score || "---"}</span></div>
                          </div>
                        </div>

                        {manualFields.medical_history && (
                          <div className="bg-black/40 border border-zinc-800/80 p-4 rounded-xl md:col-span-2">
                            <div className="text-purple-400 font-bold border-b border-zinc-800 pb-1 uppercase text-[10px] tracking-wider">Notes & History</div>
                            <p className="text-zinc-300 mt-2 whitespace-pre-wrap leading-relaxed">{manualFields.medical_history}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
}