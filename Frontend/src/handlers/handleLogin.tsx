import { loginSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

export const handleLogin = async (
  event: React.FormEvent<HTMLFormElement>,
  setIsLoggedIn: SetIsLoggedIn,
  router: { push: (path: string) => void }
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  // ✅ Zod validation
  const validation = loginSchema.safeParse({ username, password });
  if (!validation.success) {
    alert(validation.error.errors.map((err) => err.message).join("\n"));
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    // Always attempt JSON parse
    let result: any = {};
    try {
      result = await response.json();
    } catch {
      console.error("Server did not return JSON.");
      alert("Invalid response from server.");
      return;
    }

    if (!response.ok) {
      // backend sends detail for HTTPException
      alert(result.detail || "Login failed");
      return;
    }

    // ✅ Expected backend response shape
    const userId = result.userId || result.user_id;
    if (!userId) {
      console.warn("Backend did not return userId:", result);
    }

    alert("Login successful!");
    setIsLoggedIn(true);

    try {
      localStorage.setItem("isLoggedIn", "true");
      if (userId) localStorage.setItem("userId", userId);
    } catch (err) {
      console.warn("LocalStorage error:", err);
    }

    router.push("/");
  } catch (err) {
    console.error("Unexpected error during login:", err);
    alert("An unexpected error occurred.");
  }
};
