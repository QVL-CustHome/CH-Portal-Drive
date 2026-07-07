import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { PageScaffold, useTranslation, type ChNavbarItem } from "canopui";
import { useCurrentUser } from "../context/current-user";
import { StorageProvider } from "../context/StorageProvider";
import StorageBar from "./StorageBar";
import { logout } from "../api/auth";
import { navigateTo } from "../lib/navigation";
import { loginUrl } from "../lib/auth-redirect";
import { isDriveAdmin } from "../lib/roles";

export default function DriveLayout() {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const items: ChNavbarItem[] = [
    { label: t("drive.nav.files"), href: "/files", icon: "folder" },
    { label: t("drive.nav.gallery"), href: "/gallery", icon: "image" },
    { label: t("drive.nav.trash"), href: "/trash", icon: "trash" },
    ...(isDriveAdmin(me)
      ? [{ label: t("drive.nav.admin"), href: "/admin", icon: "shield" } as ChNavbarItem]
      : []),
  ];

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigateTo(loginUrl());
    }
  }

  return (
    <StorageProvider>
      <PageScaffold
        navbarTitle="CustHome"
        title={t("drive.brand")}
        items={items}
        activeHref={location.pathname}
        onNavigate={(href) => navigate(href)}
        userName={me.name}
        onLogout={handleLogout}
        sidebarWidget={
          <div className="drive-nav-storage">
            <StorageBar />
          </div>
        }
      >
        <Outlet />
      </PageScaffold>
    </StorageProvider>
  );
}
