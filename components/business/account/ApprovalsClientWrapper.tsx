"use client";

import { useEffect } from "react";

type ApprovalsClientWrapperProps = {
  children: React.ReactNode;
};

export function ApprovalsClientWrapper({
  children,
}: ApprovalsClientWrapperProps) {
  useEffect(() => {
    window.dispatchEvent(new Event("approval:refresh"));
  }, []);

  return <>{children}</>;
}
