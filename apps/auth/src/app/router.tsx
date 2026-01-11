import { Route, Routes } from "react-router-dom";
import AuthorisationPage from "../features/authorisation/ui/AuthorisationPage";
import RegistrationPage from "../features/registration/ui/RegistrationPage";

export function AuthRoutes() {
  return (
    <Routes>
      <Route index element={<RegistrationPage />} />
      <Route path="authorisation" element={<AuthorisationPage />} />
      <Route path="registration" element={<RegistrationPage />} />
      <Route path="*" element={<RegistrationPage />} />
    </Routes>
  );
}
