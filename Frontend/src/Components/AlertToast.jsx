import { AlertTriangle, X } from "lucide-react";
import { useAlert } from "../context/AlertContext";

const LABEL_STYLE = {
  "High Risk":     "border-red-500/60 bg-red-950/80 text-red-300",
  "Moderate Risk": "border-orange-500/60 bg-orange-950/80 text-orange-300",
  "Low Risk":      "border-yellow-500/60 bg-yellow-950/80 text-yellow-300",
};

const ICON_COLOR = {
  "High Risk":     "text-red-400",
  "Moderate Risk": "text-orange-400",
  "Low Risk":      "text-yellow-400",
};

export default function AlertToast() {
  const { alerts, dismiss } = useAlert();

  if (!alerts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${LABEL_STYLE[alert.label] ?? "border-slate-500/60 bg-slate-900/80 text-slate-300"}`}
        >
          <AlertTriangle className={`mt-0.5 shrink-0 ${ICON_COLOR[alert.label] ?? "text-slate-400"}`} size={18} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{alert.infantName}</p>
            <p className="text-xs mt-0.5 opacity-90">{alert.label} &mdash; {Math.round(alert.confidence * 100)}% confidence</p>
          </div>
          <button
            onClick={() => dismiss(alert.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
