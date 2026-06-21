import os
import json
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@neocare.app")

def send_push_notification(subscription_json: str, infant_name: str, label: str):
    if not VAPID_PRIVATE_KEY:
        print("VAPID private key not configured — skipping push notification")
        return

    try:
        subscription = json.loads(subscription_json)
        payload = json.dumps({
            "title": f"NeoCare Alert — {infant_name}",
            "body": f"{label} detected. Open NeoCare to review.",
        })
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
        )
        print(f"Push notification sent for {infant_name}")
    except WebPushException as e:
        print(f"Push notification failed: {e}")
    except Exception as e:
        print(f"Push notification error: {e}")
