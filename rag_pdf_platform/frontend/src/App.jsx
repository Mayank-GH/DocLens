// Top-level route map for the frontend application.
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Chat from "./pages/Chat";
import Compare from "./pages/Compare";
import Settings from "./pages/Settings";

export default function App() {
  // All pages render inside the common Layout sidebar shell.
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/chat/:docId" element={<Chat />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
