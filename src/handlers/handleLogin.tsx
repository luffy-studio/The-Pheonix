import { supabase } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations/validations";
import bcrypt from "bcryptjs";

export const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
    setIsLoggedIn?: (value: boolean) => void,
    router?: any
    ): Promise<string | null> => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
    };

  // ✅ Validate with Zod schema
    const result = loginSchema.safeParse(data);
    if (!result.success) {
        alert(
        "Login schema error: " +
            result.error.errors.map((err) => err.message).join("\n")
        );
        return null;
    }

    try {
        // 🔍 Fetch user from Supabase (include UUID!)
        const { data: user, error } = await supabase
            .from("users")
            .select("id, username, password") // 👈 fetch uuid too
            .eq("username", data.username)
            .single();

        if (error || !user) {
            alert("User not found or an error occurred.");
            return null;
        }

    // 🔑 Compare hashed password
        const isPasswordValid = await bcrypt.compare(
            data.password,
            user.password
        );
        if (!isPasswordValid) {
            alert("Invalid password.");
            return null;
        }

    // ✅ Simple token (now includes user.id instead of just username)
    const fakeToken = btoa(`${user.id}:${Date.now()}`);

    // ✅ Backward compatibility
    if (setIsLoggedIn) setIsLoggedIn(true);
    if (router) router.push("/");

    return fakeToken;
    } catch (err) {
        console.error("Error verifying login:", err);
        alert("An unexpected error occurred.");
        return null;
    }
};
