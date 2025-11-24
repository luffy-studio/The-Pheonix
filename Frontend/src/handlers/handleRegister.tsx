import { registrationSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

// 🔹 Backend URL (abhi ke liye hardcoded NGROK)
// Chahe to baad me env pe shift kar sakta hai.
const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://nonmeasurably-ethnogenic-kaylin.ngrok-free.dev";

if (!backend) {
  console.error("❌ Backend URL missing. Set NEXT_PUBLIC_BACKEND_URL env var.");
}

export const handleRegister = async (
  event: React.FormEvent<HTMLFormElement>,
  setIsLoggedIn: SetIsLoggedIn,
  router: { push: (path: string) => void }
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  // ✅ Zod validation
  const validation = registrationSchema.safeParse({ username, email, password });
  if (!validation.success) {
    alert(validation.error.errors.map((e) => e.message).join("\n"));
    return;
  }

  if (!backend) {
    alert("Backend URL is not configured.");
    return;
  }

  try {
    const response = await fetch(`${backend}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (e) {
      console.error("Server did not return valid JSON:", e);
      alert("Received invalid response from server.");
      return;
    }

    if (!response.ok) {
      alert(result?.detail || "Registration failed. Please try again.");
      return;
    }

    // ✅ Expected backend response
    const userId = result.userId || result.user_id;

    alert("Registration successful!");
    setIsLoggedIn(true);

    try {
      localStorage.setItem("isLoggedIn", "true");
      if (userId) {
        localStorage.setItem("userId", userId);
      }
    } catch (err) {
      console.warn("Failed to save to localStorage:", err);
    }

    router.push("/");
  } catch (err) {
    console.error("Unexpected error during registration:", err);
    alert("An unexpected error occurred. Please check your network and try again.");
  }
};
