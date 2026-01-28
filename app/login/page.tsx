import { LoginForm } from "@/components/auth/LoginForm";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <PageContainer title="Sign in" maxWidthClassName="max-w-md">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </PageContainer>
  );
}
