const QUESTIFY_LOGO_SRC = "/assets/logo/logo_questify.png";

export function QuestifyLogo({ className = "" }) {
  const logoClassName = ["questify-logo", className].filter(Boolean).join(" ");

  return <img className={logoClassName} src={QUESTIFY_LOGO_SRC} alt="Questify" />;
}
