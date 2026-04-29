"use client"

import type { User } from "@/lib/types";
import React, { createContext, useContext, useState } from "react";

interface UserContextType {
   user: User | null;
   setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
   user: initialUser,
   children,
}: {
   user: User | null;
   children: React.ReactNode;
}) => {
   const [user, setUser] = useState<User | null>(initialUser);
   return (
      <UserContext.Provider value={{ user, setUser }}>
         {children}
      </UserContext.Provider>
   );
};

export const useUser = () => {
   const context = useContext(UserContext);
   if (!context) throw new Error("useUser must be used within a UserProvider");
   return context.user;
};

export const useSetUser = () => {
   const context = useContext(UserContext);
   if (!context) throw new Error("useSetUser must be used within a UserProvider");
   return context.setUser;
};
