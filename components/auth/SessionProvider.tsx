"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
