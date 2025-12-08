"use client"

import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import SignOutForm from './sign-out-form'
import Logo from './logo'
import { GithubStars } from './github-stars'
import { useUser } from '@/context/UserContext'

export default function Navbar() {
   const user = useUser();
   return (
      <header className="sticky top-0 z-100 flex justify-center py-2">
         <div className="container border rounded-md w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 px-4">
            <nav className="flex items-center justify-between gap-4 sm:gap-6">
               <div className="flex items-center gap-6">
                  <Logo />
               </div>
               <div className='flex items-center gap-2'>
                  {user ? (
                     <>

                        <Link
                           href="/dashboard"
                           className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                           <Button variant="outline">
                              Dashboard
                           </Button>

                        </Link>
                        <SignOutForm />
                     </>
                  ) : (
                     <>

                        <Link
                           href="/sign-in"
                           className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                           <Button variant="outline">
                              Login
                           </Button>
                        </Link>
                        <Button asChild>
                           <Link href="/sign-up">Sign up</Link>
                        </Button>
                     </>
                  )}
                  <GithubStars />
               </div>
            </nav>
         </div>
      </header>
   )
}
