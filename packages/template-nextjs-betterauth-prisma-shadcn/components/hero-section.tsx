"use client"

import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import FadeInView from "./animate-ui/fade-in-view";

export default function HeroSection() {
   return (
      <section className="relative space-y-6 py-8 md:py-12 lg:py-40">
         <div className="container flex flex-col items-center gap-4 text-center">
            <FadeInView className="container flex flex-col items-center gap-4 text-center">
               <Badge className=" px-4 py-1.5 text-sm font-medium">
                  <Sparkles className="mr-2 size-8" />
                  Open Source Authentication Starter
               </Badge>
            </FadeInView>
            <FadeInView delay={0.2} className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
               Next.js 15 Authentication <br />
               <span className="text-transparent px-2 bg-gradient-to-r from-primary bg-clip-text">Starter Template</span>
            </FadeInView>
            <FadeInView delay={0.4} className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
               A complete, open-source authentication starter with login, registration, and protected routes. Available on GitHub.
            </FadeInView>
            <FadeInView delay={0.6} className="flex flex-wrap items-center justify-center gap-4">
               <Button asChild size="lg">
                  <Link
                     href="https://github.com/devAaus/better-auth"
                     target="_blank"
                     className="flex items-center gap-2"
                  >
                     <Github className="h-5 w-5" />
                     <span>Get the Code</span>
                  </Link>
               </Button>
               <Button variant="outline" size="lg" asChild>
                  <Link href="/sign-up" className="flex items-center gap-2">
                     <ExternalLink className="h-4 w-4" />
                     <span>Try the Demo</span>
                  </Link>
               </Button>
            </FadeInView>
         </div>
      </section>
   );
}
