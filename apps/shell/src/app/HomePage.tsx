import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HomePage as HomePageView } from "../components/HomePage";

type Page = "home" | "register" | "login";

const pageToRoute: Record<Page, string> = {
  home: "/",
  register: "/auth/registration",
  login: "/auth/authorisation",
};

export function HomePage() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (page: Page) => {
      navigate(pageToRoute[page]);
    },
    [navigate]
  );

  return <HomePageView onNavigate={handleNavigate} />;
}
