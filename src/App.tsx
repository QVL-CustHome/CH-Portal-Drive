import { Navigate, Route, Routes } from "react-router-dom";
import RequireDrive from "./components/RequireDrive";
import RequireDriveAdmin from "./components/RequireDriveAdmin";
import DriveLayout from "./components/DriveLayout";
import Files from "./pages/Files";
import Gallery from "./pages/Gallery";
import Admin from "./pages/Admin";
import Forbidden from "./pages/Forbidden";

export default function App() {
  return (
    <Routes>
      <Route path="/forbidden" element={<Forbidden />} />
      <Route element={<RequireDrive />}>
        <Route element={<DriveLayout />}>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/files" element={<Files key="files" />} />
          <Route path="/trash" element={<Files key="trash" trash />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route element={<RequireDriveAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/files" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
