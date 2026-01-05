import { Navigate, Route, Routes } from "react-router-dom";
import RegistrationPage from "./features/registration/ui/RegistrationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/auth/registration" element={<RegistrationPage />} />
      <Route path="*" element={<Navigate to="/auth/registration" replace />} />
    </Routes>
  );
}
