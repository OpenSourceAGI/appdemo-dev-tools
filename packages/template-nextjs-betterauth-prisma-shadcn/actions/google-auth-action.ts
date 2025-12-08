import { authClient } from "@/lib/auth-client";

export const signInWithGoogle = async () => {
   await authClient.signIn.social({
      provider: "google"
   })
}