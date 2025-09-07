import { z } from "zod";

// ✅ Schema for registration
export const registrationSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// ✅ Schema for login
export const loginSchema = z.object({
    username: z.string().min(1, "Username is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
