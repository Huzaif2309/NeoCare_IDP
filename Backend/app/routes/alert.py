from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.supabase_client import supabase
from app.services.email_service import send_alert_email
from app.services.push_service import send_push_notification

router = APIRouter()

class AlertRequest(BaseModel):
    infant_id: str
    label: str
    confidence: float

@router.post("/alert")
def trigger_alert(body: AlertRequest):
    # Fetch infant with linked doctor and caregiver emails
    infant_resp = (
        supabase
        .table("infants")
        .select("name, doctor_id, caregiver_id, doctors(email), caregivers(email)")
        .eq("id", body.infant_id)
        .limit(1)
        .execute()
    )
    if not infant_resp.data:
        raise HTTPException(status_code=404, detail="Infant not found")

    infant = infant_resp.data[0]
    infant_name = infant.get("name", "Unknown Infant")

    to_emails = []
    if infant.get("doctors") and infant["doctors"].get("email"):
        to_emails.append(infant["doctors"]["email"])
    if infant.get("caregivers") and infant["caregivers"].get("email"):
        to_emails.append(infant["caregivers"]["email"])

    # Send email alerts
    send_alert_email(to_emails, infant_name, body.label, body.confidence)

    # Fetch push subscriptions for linked users
    user_ids = []
    if infant.get("doctor_id"):
        user_ids.append(infant["doctor_id"])
    if infant.get("caregiver_id"):
        user_ids.append(infant["caregiver_id"])

    if user_ids:
        subs_resp = (
            supabase
            .table("push_subscriptions")
            .select("subscription_json")
            .in_("user_id", user_ids)
            .execute()
        )
        for row in (subs_resp.data or []):
            send_push_notification(row["subscription_json"], infant_name, body.label)

    return {"sent": True, "infant": infant_name, "label": body.label}


class PushSubscribeRequest(BaseModel):
    user_id: str
    subscription_json: str

@router.post("/push-subscribe")
def push_subscribe(body: PushSubscribeRequest):
    supabase.table("push_subscriptions").upsert(
        {"user_id": body.user_id, "subscription_json": body.subscription_json},
        on_conflict="user_id"
    ).execute()
    return {"subscribed": True}
