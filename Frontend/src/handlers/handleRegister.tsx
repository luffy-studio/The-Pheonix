import { registrationSchema } from "@/lib/validations/validations";

type SetIsLoggedIn = (value: boolean) => void;

const getBackendUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  );
};

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

  // Validate with Zod
  const validation = registrationSchema.safeParse({ username, email, password });
  if (!validation.success) {
    alert(validation.error.errors.map((e) => e.message).join("\n"));
    return;
  }

  const backend = getBackendUrl();

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

    const userId = result.userId || result.user_id;
    const token = result.token || result.access_token;

    setIsLoggedIn(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
      if (userId) localStorage.setItem("userId", userId);
      if (token) localStorage.setItem("token", token);
      if (username) localStorage.setItem("username", username);
    }

    router.push("/");
  } catch (err) {
    console.error("Unexpected error during registration:", err);
    alert(`Backend unreachable at ${backend}. Please ensure the backend server is running.`);
  }
};
