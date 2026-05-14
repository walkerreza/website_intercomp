import { AuthForm } from "../components/AuthForm.jsx";

export function LoginPage({ onAuthenticated }) {
  return (
    <main className="login-page">
      <AuthForm onAuthenticated={onAuthenticated} />
    </main>
  );
}
