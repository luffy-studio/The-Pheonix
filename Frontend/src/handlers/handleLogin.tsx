import { loginSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

const getBackendUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  );
};

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

  const backend = getBackendUrl();

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
      alert(data?.detail || "Login failed: Invalid credentials.");
      return;
    }

    const result = await response.json();
    const userId = result.userId || result.user_id;
    const token = result.token || result.access_token;

    setIsLoggedIn(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
      if (userId) localStorage.setItem("userId", userId);
      if (token) localStorage.setItem("token", token);
      if (result.username) localStorage.setItem("username", result.username);
    }

    router.push("/");
  } catch (err) {
    console.error("Login request failed:", err);
    alert(`Backend unreachable at ${backend}. Please ensure the backend server is running.`);
  }
};
