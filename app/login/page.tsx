import { LoginForm } from "@/components/auth/LoginForm";
import { PageContainer } from "@/components/business/layout/PageContainer";

export default function LoginPage() {
  return (
    <PageContainer title="Sign in" maxWidthClassName="max-w-md">
      <LoginForm />
    </PageContainer>
  );
}
