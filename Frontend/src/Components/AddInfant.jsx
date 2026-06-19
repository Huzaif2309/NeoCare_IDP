import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Navbar from "./Navbar";

export default function AddInfant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [caregivers, setCaregivers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    dob: "",
    gestational_age_weeks: "",
    birth_weight_kg: "",
    birth_length_cm: "",
    birth_head_circumference_cm: "",
    blood_type: "",
    medical_history: "",
    doctor_id: "",
    caregiver_id: "",
    device_id: "",
  });

  useEffect(() => {
    const initializeForm = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (doctorsError) console.error("Error fetching doctors:", doctorsError.message);
      else setDoctors(doctorsData || []);

      // Fetch caregivers
      const { data: caregiversData, error: caregiversError } = await supabase
        .from("caregivers")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (caregiversError) console.error("Error fetching caregivers:", caregiversError.message);
      else setCaregivers(caregiversData || []);
    };

    initializeForm();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        name: formData.name,
        gender: formData.gender,
        dob: formData.dob || null,
        gestational_age_weeks: formData.gestational_age_weeks ? parseInt(formData.gestational_age_weeks) : null,
        birth_weight_kg: formData.birth_weight_kg ? parseFloat(formData.birth_weight_kg) : null,
        birth_length_cm: formData.birth_length_cm ? parseFloat(formData.birth_length_cm) : null,
        birth_head_circumference_cm: formData.birth_head_circumference_cm ? parseFloat(formData.birth_head_circumference_cm) : null,
        blood_type: formData.blood_type || null,
        medical_history: formData.medical_history || null,
        device_id: formData.device_id || null,
        doctor_id: formData.doctor_id || null,
        caregiver_id: formData.caregiver_id || null,
      };

      const { error } = await supabase.from("infants").insert([payload]);
      if (error) throw error;

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Failed execution registering entry.");
    } finally {
      setLoading(false);
    }
  };

  // Shared input classes
  const inputCls = "w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition font-mono placeholder-zinc-600";
  const labelCls = "block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono";

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-black text-white pt-24 px-6 pb-12 overflow-hidden">
        <div className="absolute top-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[160px]" />
        <div className="absolute bottom-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[160px]" />

        <main className="relative z-10 max-w-3xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-cyan-400 font-mono transition">
              <ArrowLeft className="h-4 w-4" /> BACK TO DASHBOARD
            </Link>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl p-8 rounded-2xl">
            <h2 className="text-2xl font-black tracking-tight text-white mb-1">Patient Entry Matrix</h2>
            <p className="text-zinc-400 text-xs mb-6 font-mono uppercase tracking-wider text-cyan-500/80">
              Add Neonatal Records to Live Core Cluster
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-3 text-sm font-mono">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── SECTION: Identity ── */}
              <div>
                <p className="text-[10px] font-mono font-bold text-cyan-500/60 uppercase tracking-widest mb-3 border-b border-zinc-800/80 pb-1">
                  Identity &amp; Registration
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Infant Full Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange}
                      className={inputCls} placeholder="e.g. Baby John Doe" />
                  </div>
                  <div>
                    <label className={labelCls}>Telemetry Device ID</label>
                    <input type="text" name="device_id" value={formData.device_id} onChange={handleChange}
                      className={inputCls} placeholder="e.g. DEVICE-NICU-08" />
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Undetermined</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* ── SECTION: Clinical Measurements ── */}
              <div>
                <p className="text-[10px] font-mono font-bold text-cyan-500/60 uppercase tracking-widest mb-3 border-b border-zinc-800/80 pb-1">
                  Clinical Biometric Measurements
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Gestational Age (Weeks)</label>
                    <input type="number" name="gestational_age_weeks" value={formData.gestational_age_weeks}
                      onChange={handleChange} className={inputCls} placeholder="e.g. 34" min="22" max="45" />
                  </div>
                  <div>
                    <label className={labelCls}>Birth Weight (kg)</label>
                    <input type="number" step="0.01" name="birth_weight_kg" value={formData.birth_weight_kg}
                      onChange={handleChange} className={inputCls} placeholder="e.g. 2.45" />
                  </div>
                  <div>
                    <label className={labelCls}>Birth Length (cm)</label>
                    <input type="number" step="0.1" name="birth_length_cm" value={formData.birth_length_cm}
                      onChange={handleChange} className={inputCls} placeholder="e.g. 46.5" />
                  </div>
                  <div>
                    <label className={labelCls}>Head Circumference (cm)</label>
                    <input type="number" step="0.1" name="birth_head_circumference_cm" value={formData.birth_head_circumference_cm}
                      onChange={handleChange} className={inputCls} placeholder="e.g. 31.2" />
                  </div>
                  <div>
                    <label className={labelCls}>Blood Group Type</label>
                    <select name="blood_type" value={formData.blood_type} onChange={handleChange} className={inputCls}>
                      <option value="">Unknown / Not Tested</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECTION: Assigned Staff ── */}
              <div>
                <p className="text-[10px] font-mono font-bold text-cyan-500/60 uppercase tracking-widest mb-3 border-b border-zinc-800/80 pb-1">
                  Assigned Medical Staff
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Doctor Dropdown */}
                  <div>
                    <label className={labelCls}>Overseeing Physician</label>
                    <select name="doctor_id" value={formData.doctor_id} onChange={handleChange} className={inputCls}>
                      <option value="">— No Doctor Selected —</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.full_name}{doc.email ? ` · ${doc.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Caregiver Dropdown */}
                  <div>
                    <label className={labelCls}>Assigned Caregiver</label>
                    <select name="caregiver_id" value={formData.caregiver_id} onChange={handleChange} className={inputCls}>
                      <option value="">— No Caregiver Selected —</option>
                      {caregivers.map((cg) => (
                        <option key={cg.id} value={cg.id}>
                          {cg.full_name}{cg.email ? ` · ${cg.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECTION: Clinical Notes ── */}
              <div>
                <p className="text-[10px] font-mono font-bold text-cyan-500/60 uppercase tracking-widest mb-3 border-b border-zinc-800/80 pb-1">
                  Clinical Observations
                </p>
                <label className={labelCls}>Medical History &amp; Notes</label>
                <textarea rows="4" name="medical_history" value={formData.medical_history} onChange={handleChange}
                  className={inputCls}
                  placeholder="Log any baseline diagnoses, incubation conditions, known complications, or clinical notes here..." />
              </div>

              {/* Submit Row */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
                <Link to="/dashboard"
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold font-mono text-zinc-400 hover:bg-zinc-900 transition">
                  CANCEL
                </Link>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-black uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:bg-cyan-600 disabled:opacity-40 transition">
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 stroke-[2.5]" /> Commit to System Registry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}