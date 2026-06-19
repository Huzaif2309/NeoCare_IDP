from app.db.supabase_client import supabase

def get_infant(infant_id: str):
    response = (
        supabase
        .table("infants")
        .select("*")
        .eq("id", infant_id)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]

def get_latest_vitals(infant_id: str):
    response = (
        supabase
        .table("infant_vitals")
        .select("*")
        .eq("infant_id", infant_id)
        .order("created_at", desc=True)  # <-- Changed here
        .limit(1)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]

def get_latest_sensor_data(infant_id: str):
    response = (
        supabase
        .table("infant_sensor_data")
        .select("*")
        .eq("infant_id", infant_id)
        .order("recorded_at", desc=True)  # <-- Changed here
        .limit(1)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]