import React from "react";
import ReactDOM from "react-dom/client";
import ChatInterface from "./chat-interface";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ChatInterface />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Chat application cannot start.");
}
