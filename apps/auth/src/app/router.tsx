import { Route, Routes } from "react-router-dom";
import RegisterPage from "../features/registration/ui/RegistrationPage";

export function AuthRoutes() {
  return (
    <Routes>
      <Route index element={<RegisterPage />} />
      <Route path="*" element={<RegisterPage />} />
    </Routes>
  );
}
