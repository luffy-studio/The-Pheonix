import { loginSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

// Current NGROK Backend URL
const backend = "https://nonmeasurably-ethnogenic-kaylin.ngrok-free.dev";

export const handleLogin = async (
  event: React.FormEvent<HTMLFormElement>,
  setIsLoggedIn: SetIsLoggedIn,
  router: { push: (path: string) => void }
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  // Validate with Zod
  const validation = loginSchema.safeParse({ username, password });
  if (!validation.success) {
    alert(validation.error.errors.map((err) => err.message).join("\n"));
    return;
  }

  try {
    const response = await fetch(`${backend}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.detail || "Login failed");
      return;
    }

    const result = await response.json();
    const userId = result.userId || result.user_id;

    alert("Login successful!");
    setIsLoggedIn(true);

    localStorage.setItem("isLoggedIn", "true");
    if (userId) localStorage.setItem("userId", userId);

    router.push("/");
  } catch (err) {
    console.error("Login request failed:", err);
    alert("Backend unreachable. Check ngrok is running.");
  }
};
