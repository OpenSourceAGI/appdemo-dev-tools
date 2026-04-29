import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function AuthLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   const session = await auth.api.getSession({
      headers: await headers()
   })

   if (session) {
      return redirect("/")
   }
   return (
      <main>
         <div className="h-screen flex flex-col items-center justify-center">
            {children}
         </div>
      </main>
   );
}
