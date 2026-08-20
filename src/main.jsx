import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import "./styles/main.scss";
import App from "./App.jsx";
import { makeServer, shouldStartMockServer } from "./mocks/server";

if (shouldStartMockServer()) {
  makeServer({
    environment: import.meta.env.PROD ? "production" : "development",
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
