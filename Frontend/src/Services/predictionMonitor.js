import { supabase } from "../supabaseClient";

const FASTAPI_URL = "http://localhost:8000";

let intervalRef = null;

// Labels that should trigger an alert (anything that isn't safe)
const ALERT_LABELS = new Set(["High Risk", "Moderate Risk", "Low Risk"]);

// Track the last label we fired an alert for, per infant
const lastAlertedLabel = {};

export async function runPredictionCycle() {
  try {
    console.log("Running prediction cycle...");

    // Get all infants
    const { data: infants, error } = await supabase
      .from("infants")
      .select("id, name");

    if (error) throw error;

    if (!infants?.length) {
      console.log("No infants found");
      return;
    }

    for (const infant of infants) {
      try {
        const response = await fetch(
          `${FASTAPI_URL}/predict/${infant.id}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          console.error(
            `Prediction failed for ${infant.id}`
          );
          continue;
        }

        const result = await response.json();

        const prediction =
          result.prediction?.prediction;

        const confidence =
          result.prediction?.confidence;

        const { error: insertError } =
          await supabase
            .from("prediction_history")
            .upsert(
                {
                infant_id: infant.id,
                prediction_label: prediction,
                confidence: confidence,
                created_at: new Date().toISOString()
                },
                {
                onConflict: "infant_id"
                }
            );

        if (insertError) {
          console.error(
            "Prediction insert failed:",
            insertError.message
          );
        }

        // Fire alert only when transitioning into an alerting state
        const prev = lastAlertedLabel[infant.id];
        if (ALERT_LABELS.has(prediction) && prediction !== prev) {
          lastAlertedLabel[infant.id] = prediction;

          // Notify in-app toast via window event (picked up by App.jsx)
          window.dispatchEvent(
            new CustomEvent("neocare-alert", {
              detail: { infantName: infant.name || infant.id, label: prediction, confidence },
            })
          );

          // Notify backend (email + push) — fire and forget
          fetch(`${FASTAPI_URL}/alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ infant_id: infant.id, label: prediction, confidence }),
          }).catch((err) => console.error("Alert request failed:", err.message));

        } else if (!ALERT_LABELS.has(prediction)) {
          // Reset so the next time this infant enters an alerting state it fires again
          delete lastAlertedLabel[infant.id];
        }

      } catch (err) {
        console.error(
          `Prediction cycle failed for infant ${infant.id}:`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error(
      "Global prediction monitor failure:",
      err.message
    );
  }
}

export function startPredictionMonitor() {
  if (intervalRef) return;

  runPredictionCycle();

  intervalRef = setInterval(() => {
    runPredictionCycle();
  }, 5000);

  console.log("Prediction monitor started");
}

export function stopPredictionMonitor() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
}