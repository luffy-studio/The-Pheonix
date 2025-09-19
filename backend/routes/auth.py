from fastapi import APIRouter, HTTPException
import bcrypt
import uuid
from supabase_client import supabase_admin
from models.auth_models import RegisterRequest, LoginRequest

router = APIRouter()

@router.post("/login")
def login_user(req: LoginRequest):
    # 🔹 Fetch user by username
    user = (
        supabase_admin.table("users")
        .select("id, username, password")
        .eq("username", req.username)
        .execute()
    )

    if not user.data or len(user.data) == 0:
        raise HTTPException(status_code=400, detail="User not found")

    user_data = user.data[0] if isinstance(user.data, list) else user.data

    # 🔹 Check password
    stored_hash = user_data["password"]
    if not bcrypt.checkpw(req.password.encode("utf-8"), stored_hash.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid password")

    return {"message": "Login successful", "userId": user_data["id"]}


@router.post("/register")
def register_user(req: RegisterRequest):
    # 🔹 Check if username exists
    username_check = (
        supabase_admin.table("users")
        .select("id")
        .eq("username", req.username)
        .execute()
    )
    if username_check.data and len(username_check.data) > 0:
        raise HTTPException(status_code=400, detail="Username is already taken")

    # 🔹 Check if email exists
    email_check = (
        supabase_admin.table("users")
        .select("id")
        .eq("email", req.email)
        .execute()
    )
    if email_check.data and len(email_check.data) > 0:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # 🔹 Hash password
    hashed_pw = bcrypt.hashpw(
        req.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    # 🔹 Generate UUID
    user_id = str(uuid.uuid4())

    # 🔹 Insert into Supabase
    response = (
        supabase_admin.table("users")
        .insert({
            "id": user_id,
            "username": req.username,
            "email": req.email,
            "password": hashed_pw,
        })
        .execute()
    )

    # Supabase client may not have .status_code
    if hasattr(response, "status_code") and response.status_code >= 400:
        raise HTTPException(status_code=500, detail="Failed to save user")

    return {"message": "Registration successful", "userId": user_id}
