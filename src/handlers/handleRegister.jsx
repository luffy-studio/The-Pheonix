// handleRegister.js
import { supabase } from "@/lib/supabase";
import { registrationSchema } from "@/lib/validations/validations";
import bcrypt from "bcryptjs"; // ✅ install with: npm install bcryptjs

export const handleRegister = async (event) => {
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
        return;
    }

    try {
        // ✅ Step 1: Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .or(`email.eq.${data.email},username.eq.${data.username}`)
            .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found (safe to ignore)
        console.error("Error checking user:", fetchError);
        alert("An error occurred while checking existing users.");
        return;
    }

    if (existingUser) {
        alert("⚠️ User already registered with this email or username.");
        return;
    }

    // ✅ Step 2: Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // ✅ Step 3: Insert new user with hashed password
    const { error } = await supabase.from("users").insert({
        username: data.username,
        email: data.email,
        password: hashedPassword, // 🔒 secure!
    });

    if (error) {
        console.error("Error saving user data:", error);
        alert("An error occurred while saving user data.");
        return;
    }

    alert("✅ Registration successful!");
    console.log("User registered:", { ...data, password: "🔒 (hashed)" });
    } catch (err) {
        console.error("Unexpected error during registration:", err);
        alert("An unexpected error occurred.");
    }
};
