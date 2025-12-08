"use client"

import {
   Card,
   CardContent,
   CardHeader
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, Mail, MapPin, Shield } from "lucide-react"
import { useUser } from "@/context/UserContext"

export default function ProfileCard() {
   const user = useUser();
   return (
      <Card className="overflow-hidden">
         <CardHeader className="relative p-0">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40"></div>
            <div className="absolute -bottom-12 left-4">
               <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background">
                     <AvatarImage src={user?.image || ''} alt="John Doe" />
                     <AvatarFallback className="text-6xl font-bold">
                        {user?.name.charAt(0)}
                     </AvatarFallback>
                  </Avatar>
               </div>
            </div>
         </CardHeader>
         <CardContent className="pt-14">
            <div className="space-y-1">
               <h3 className="font-semibold text-xl">
                  {user?.name}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {user?.email}
               </p>
            </div>
            <div className="flex items-center gap-2 mt-4">
               <Badge variant="outline" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
               </Badge>
               <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Member since {user?.createdAt.getFullYear()}
               </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
               <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                     <p className="text-sm font-medium">Location</p>
                     <p className="text-sm text-muted-foreground">New York, USA</p>
                  </div>
               </div>
               <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                     <p className="text-sm font-medium">Email</p>
                     <p className="text-sm text-muted-foreground">
                        {user?.email}
                     </p>
                  </div>
               </div>
               <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                     <p className="text-sm font-medium">Account Security</p>
                     <p className="text-sm text-muted-foreground">2FA Enabled</p>
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   )
}
