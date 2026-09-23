import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { Icon } from "canopui";
import { thumbnailUrl, type Node } from "../api/drive";

interface GalleryTileProps {
  node: Node;
  onOpen: () => void;
}

export default function GalleryTile({ node, onOpen }: GalleryTileProps) {
  const isVideo = node.media_type === "video";

  return (
    <ButtonBase
      onClick={onOpen}
      focusRipple
      aria-label={node.name}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: "var(--canop-radius-md)",
        overflow: "hidden",
        backgroundColor: "surface.sunken",
        transition: "transform var(--canop-motion-duration-fast) var(--canop-motion-ease-standard)",
        "&:hover": { transform: "scale(1.02)" },
        "&:focus-visible": {
          outline: "0.125rem solid",
          outlineColor: "primary.main",
          outlineOffset: "0.125rem",
        },
      }}
    >
      {node.has_thumbnail ? (
        <Box
          component="img"
          src={thumbnailUrl(node.id)}
          alt={node.name}
          loading="lazy"
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: "text.secondary",
          }}
        >
          <Icon name={isVideo ? "image" : "file"} size="lg" color="inherit" />
        </Box>
      )}
      {isVideo && (
        <Box
          sx={{
            position: "absolute",
            right: "0.4rem",
            bottom: "0.4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.75rem",
            height: "1.75rem",
            borderRadius: "var(--canop-radius-pill)",
            border: "0.0625rem solid",
            borderColor: "divider",
            backgroundColor: "surface.overlay",
          }}
        >
          <Icon name="caretRight" variant="solid" size="xs" color="primary" />
        </Box>
      )}
    </ButtonBase>
  );
}
