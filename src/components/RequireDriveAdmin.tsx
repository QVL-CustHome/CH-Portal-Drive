import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../context/current-user";
import { isDriveAdmin } from "../lib/roles";

export default function RequireDriveAdmin() {
  const me = useCurrentUser();
  return isDriveAdmin(me) ? <Outlet /> : <Navigate to="/files" replace />;
}
