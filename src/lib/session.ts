import type { User } from "@/lib/types";

// Replace this with `auth()` from NextAuth once credentials are connected.
export async function getCurrentUser(): Promise<User> {
  return {
    id: "user-rami",
    username: "Rami",
    totalPoints: 36,
  };
}
