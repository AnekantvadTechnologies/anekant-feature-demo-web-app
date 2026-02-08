import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BackupPresentation } from "@/pages/BackupPresentation";
import { Presentation } from "@/pages/Presentation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Presentation />} />
        <Route path="/backup" element={<BackupPresentation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
