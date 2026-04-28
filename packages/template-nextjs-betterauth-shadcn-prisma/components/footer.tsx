import React from 'react'

export default function Footer() {
   return (
      <footer className="border-t py-6 md:py-0">
         <div className="flex items-center justify-center overflow-hidden">
            <div className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-bold select-none pointer-events-none leading-none bg-gradient-to-br from-primary/30 to-primary/5 bg-clip-text text-transparent opacity-60 tracking-tighter">
               AUTH SYSTEM
            </div>
         </div>
         <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground">
               &copy; {new Date().getFullYear()} AuthSystem. All rights reserved.
            </p>
         </div>
      </footer>
   )
}
