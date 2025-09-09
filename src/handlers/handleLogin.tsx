import { supabase } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations/validations";
import bcrypt from "bcryptjs";

type SetIsLoggedIn = (value: boolean) => void;

export const handleLogin = async (
  event: React.FormEvent<HTMLFormElement>,
  setIsLoggedIn: SetIsLoggedIn,
  router: { push: (path: string) => void }
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const data = {
    username: String(formData.get("username") || ""),
    password: String(formData.get("password") || ""),
  };

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    alert(result.error.errors.map((err) => err.message).join("\n"));
    return;
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password")
      .eq("username", data.username)
      .single();

    if (error || !user) {
      alert("User not found or an error occurred.");
      return;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      alert("Invalid password.");
      return;
    }

    setIsLoggedIn(true);
    try { localStorage.setItem("isLoggedIn", "true"); } catch {}
    router.push("/");
  } catch (err) {
    console.error("Error verifying login:", err);
    alert("An unexpected error occurred.");
  }
};



