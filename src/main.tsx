import './setupFetch';

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "../src/Contex/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HelmetProvider } from 'react-helmet-async'; // ← এটা যোগ করুন

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider> {/* ← wrap করুন */}
      <AuthProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </HelmetProvider> {/* ← বন্ধ করুন */}
  </StrictMode>
);