import { createRoot } from "react-dom/client";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <SubscriptionProvider>
    <App />
  </SubscriptionProvider>
);
