import { supabase } from "../supabaseClient";

const FASTAPI_URL = "http://localhost:8000";

let intervalRef = null;

export async function runPredictionCycle() {
  try {
    console.log("Running prediction cycle...");

    // Get all infants
    const { data: infants, error } = await supabase
      .from("infants")
      .select("id");

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