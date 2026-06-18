import { Button, Feedback, Heading, Stack, useTranslation } from "@custhome/ui";
import { navigateTo } from "../lib/navigation";
import { loginUrl } from "../lib/auth-redirect";

export default function Forbidden() {
  const { t } = useTranslation();

  return (
    <div className="drive-centered">
      <Stack gap="lg">
        <Heading level={1} size={3}>
          {t("drive.forbidden.title")}
        </Heading>
        <Feedback severity="error">{t("drive.forbidden.message")}</Feedback>
        <Button variant="secondary" onClick={() => navigateTo(loginUrl())}>
          {t("drive.forbidden.switch")}
        </Button>
      </Stack>
    </div>
  );
}
