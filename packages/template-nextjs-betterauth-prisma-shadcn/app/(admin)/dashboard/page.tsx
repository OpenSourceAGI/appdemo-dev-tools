import ProfileCard from "@/components/profile-card"

export default function DashboardPage() {
   return (
      <div className="flex flex-col gap-6 w-full">
         <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
               Welcome back!
            </h2>
         </div>

         <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <ProfileCard />
         </div>
      </div>
   )
}

