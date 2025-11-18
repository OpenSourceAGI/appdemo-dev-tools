import { SignupForm } from "@/components/auth-forms";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an account",
};

export default async function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <SignupForm />
    </main>
  );
}
