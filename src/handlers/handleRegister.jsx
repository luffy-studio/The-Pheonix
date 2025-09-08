import { supabase } from "@/lib/supabase";
import { registrationSchema } from "@/lib/validations/validations";
import bcrypt from "bcryptjs"; // ✅ install with: npm install bcryptjs
import { v4 as uuidv4 } from "uuid"; // ✅ install with: npm install uuid

export const handleRegister = async (event, setIsLoggedIn, router) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // ✅ Validate with Zod
  const result = registrationSchema.safeParse(data);
  if (!result.success) {
    alert(result.error.errors.map((err) => err.message).join("\n"));
    return null;
  }

  try {
    // ✅ Step 1: Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${data.email},username.eq.${data.username}`)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking user:", fetchError);
      alert("An error occurred while checking existing users.");
      return null;
    }

    if (existingUser) {
      alert("⚠️ User already registered with this email or username.");
      return null;
    }

    // ✅ Step 2: Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // ✅ Step 3: Generate UUID
    const userId = uuidv4();

    // ✅ Step 4: Insert user with UUID
    const { error } = await supabase.from("users").insert({
      id: userId, // 👈 UUID here
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });

    if (error) {
      console.error("Error saving user data:", error);
      alert("An error occurred while saving user data.");
      return null;
    }

    alert("✅ Registration successful!");
    console.log("User registered:", { id: userId, ...data, password: "🔒 (hashed)" });

    // ✅ Optional: issue a simple token (demo)
    const fakeToken = btoa(`${data.username}:${Date.now()}`);

    if (setIsLoggedIn) setIsLoggedIn(true);
    if (router) router.push("/");

    return fakeToken;
  } catch (err) {
    console.error("Unexpected error during registration:", err);
    alert("An unexpected error occurred.");
    return null;
  }
};
