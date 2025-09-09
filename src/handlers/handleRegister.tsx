// handleRegister.tsx
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { registrationSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

export const handleRegister = async (
  event: React.FormEvent<HTMLFormElement>,
  setIsLoggedIn: SetIsLoggedIn,
  router: { push: (path: string) => void }
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const validation = registrationSchema.safeParse({ username, email, password });
  if (!validation.success) {
    alert(
      validation.error.errors.map((e) => e.message).join("\n")
    );
    return;
  }

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`);

    if (fetchError) {
      console.error("Error checking user:", fetchError.message);
      alert("An error occurred while checking existing users.");
      return;
    }

    if (existingUser && existingUser.length > 0) {
      alert("User already registered with this email or username.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        username,
        email,
        password: hashedPassword,
      });

    if (insertError) {
      console.error("Error saving user data:", insertError.message);
      alert(`Failed to save user: ${insertError.message}`);
      return;
    }

    alert("Registration successful!");
    setIsLoggedIn(true);
    try { localStorage.setItem("isLoggedIn", "true"); } catch {}
    router.push("/");
  } catch (err) {
    console.error("Unexpected error during registration:", err);
    alert("An unexpected error occurred.");
  }
};
