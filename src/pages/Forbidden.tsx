import Box from "@mui/material/Box";
import { Button, Feedback, Heading, Stack, useTranslation } from "canopui";
import { navigateTo } from "../lib/navigation";
import { loginUrl } from "../lib/auth-redirect";

export default function Forbidden() {
  const { t } = useTranslation();

  return (
    <Box
      maxWidth="30rem"
      marginX="auto"
      marginTop="15vh"
      padding="1.5rem"
    >
      <Stack gap="lg">
        <Heading level={1} size={3}>
          {t("drive.forbidden.title")}
        </Heading>
        <Feedback severity="error">{t("drive.forbidden.message")}</Feedback>
        <Button variant="secondary" onClick={() => navigateTo(loginUrl())}>
          {t("drive.forbidden.switch")}
        </Button>
      </Stack>
    </Box>
  );
}
