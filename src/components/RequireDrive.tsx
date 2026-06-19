import { Navigate, Outlet } from "react-router-dom";
import { RouteGuard, useTranslation } from "@custhome/ui";
import { getMe, type Me } from "../api/auth";
import { ApiError } from "../api/client";
import { isPortalDrive } from "../lib/roles";
import { navigateTo } from "../lib/navigation";
import { loginUrl } from "../lib/auth-redirect";

export default function RequireDrive() {
  const { t } = useTranslation();
  return (
    <RouteGuard<Me>
      fetchUser={getMe}
      hasAccess={isPortalDrive}
      isUnauthorizedError={(error) =>
        error instanceof ApiError && error.status === 401
      }
      onUnauthorized={() => navigateTo(loginUrl())}
      loadingLabel={t("drive.loading")}
      errorLabel={t("drive.guard.loadError")}
      renderForbidden={() => <Navigate to="/forbidden" replace />}
      renderAuthorized={() => <Outlet />}
    />
  );
}
