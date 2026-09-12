import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import OpsisPage from "./pages/OpsisPage";
import SobrePage from "./pages/SobrePage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/opsis" element={<OpsisPage />} />
        <Route path="/sobre" element={<SobrePage />} />
      </Routes>
    </BrowserRouter>
  );
}
