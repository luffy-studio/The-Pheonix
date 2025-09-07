import { supabase } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations/validations";
import bcrypt from "bcryptjs"; // ✅ Import bcrypt
import { useRouter } from "next/router";
import { useAuth } from "@/lib/context/AuthContext";

export const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();

    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
    };

  // ✅ Validate with Zod schema
    const result = loginSchema.safeParse(data);
    if (!result.success) {
        alert(" login schema error " + result.error.errors.map((err) => err.message).join("\n"));
        return;
    }

    try {
        // 🔍 Get user from Supabase by username
        const { data: user, error } = await supabase
        .from("users")
        .select("username, password") // password should be hashed in DB
        .eq("username", data.username)
        .single();

        if (error || !user) {
        alert("User not found or an error occurred.");
        return;
        }

        // 🔑 Compare hashed password with entered password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
        alert("Invalid password.");
        return;
        }

        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");  
        router.push("/");
    } catch (err) {
        console.error("Error verifying login:", err);
        alert("An unexpected error occurred.");
    }
};



