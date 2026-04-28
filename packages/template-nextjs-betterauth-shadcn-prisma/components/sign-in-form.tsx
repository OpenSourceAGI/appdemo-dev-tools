"use client"

import { Button } from "@/components/ui/button"
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { signInFormSchema } from "@/lib/auth-schema"

import { zodResolver } from "@hookform/resolvers/zod"
import { redirect } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"


export default function SignInForm() {
   const form = useForm<z.infer<typeof signInFormSchema>>({
      resolver: zodResolver(signInFormSchema),
      defaultValues: {
         email: "",
         password: "",
      },
   })

   async function onSubmit(values: z.infer<typeof signInFormSchema>) {
      const { email, password } = values;
      await authClient.signIn.email({
         email,
         password,
      }, {
         onRequest: () => {
            toast.loading("Signing in...")
         },
         onSuccess: () => {
            toast.dismiss();
            toast.success("Signed in successfully");
            redirect("/dashboard")
         },
         onError: (ctx) => {
            toast.dismiss();
            toast.error(ctx.error.message);
         },
      });
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
               control={form.control}
               name="email"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Email</FormLabel>
                     <FormControl>
                        <Input placeholder="m@example.com" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={form.control}
               name="password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Password</FormLabel>
                     <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <Button type="submit" className="w-full">
               Sign In
            </Button>
         </form>
      </Form>
   )
}
