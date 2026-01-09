import { RouterProvider } from "react-router-dom";
import { createShellRouter } from "./app/router";

export function App() {
  const router = createShellRouter();
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
