import { AuthForm } from "../components/AuthForm.jsx";
import { BrandPanel } from "../components/BrandPanel.jsx";

export function LoginPage({ onAuthenticated }) {
  return (
    <main className="login-page">
      <BrandPanel />
      <AuthForm onAuthenticated={onAuthenticated} />
    </main>
  );
}
