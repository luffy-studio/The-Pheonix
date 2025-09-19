from fastapi import APIRouter
from supabase_client import supabase, supabase_admin

router = APIRouter()

@router.get("/")
def get_users():
    response = supabase.table("users").select("*").execute()
    return response.data

@router.post("/")
def add_user(name: str, email: str):
    response = supabase_admin.table("users").insert(
        {"name": name, "email": email}
    ).execute()
    return {"status": "success", "data": response.data}
