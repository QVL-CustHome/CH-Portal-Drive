import { ApiError, request } from "./client";

export interface Storage {
  quota_bytes: number;
  used_bytes: number;
}

export interface Crumb {
  id: string;
  name: string;
}

export interface Node {
  id: string;
  parent_id: string | null;
  kind: "folder" | "file";
  name: string;
  mime: string | null;
  size_bytes: number;
  is_media: boolean;
  media_type: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  has_thumbnail: boolean;
  taken_at: string | null;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListResponse {
  parent_id: string;
  ancestors: Crumb[];
  items: Node[];
}

export function getStorage() {
  return request<Storage>("/drive/me/storage");
}

export function listNodes(parentId?: string | null) {
  const query = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
  return request<ListResponse>(`/drive/files${query}`);
}

export function listTrash() {
  return request<Node[]>("/drive/trash");
}

export function createFolder(name: string, parentId?: string | null) {
  return request<Node>("/drive/folders", {
    method: "POST",
    body: JSON.stringify({ name, parent_id: parentId ?? null }),
  });
}

export function renameNode(id: string, name: string) {
  return request<Node>(`/drive/nodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function moveNode(id: string, parentId: string) {
  return request<Node>(`/drive/nodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ parent_id: parentId }),
  });
}

export function trashNode(id: string) {
  return request<void>(`/drive/nodes/${id}/trash`, { method: "POST" });
}

export function restoreNode(id: string) {
  return request<Node>(`/drive/nodes/${id}/restore`, { method: "POST" });
}

export function searchNodes(query: string) {
  return request<Node[]>(`/drive/search?q=${encodeURIComponent(query)}`);
}

export function listDuplicates() {
  return request<Node[]>("/drive/duplicates");
}

export function purgeNode(id: string) {
  return request<void>(`/drive/nodes/${id}`, { method: "DELETE" });
}

export function emptyTrash() {
  return request<void>("/drive/trash/purge", { method: "POST" });
}

export async function uploadFile(file: File, parentId?: string | null): Promise<Node> {
  const query = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
  const form = new FormData();
  form.set("file", file, file.name);

  const res = await fetch(`/api/drive/files${query}`, {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") code = body.error;
      if (typeof body?.message === "string") message = body.message;
      else if (code) message = code;
    } catch {
      message = `Erreur ${res.status}`;
    }
    throw new ApiError(res.status, message, code);
  }
  return (await res.json()) as Node;
}

export function listGallery() {
  return request<Node[]>("/drive/gallery");
}

export interface DriveAdminUser {
  user_id: string;
  quota_bytes: number;
  used_bytes: number;
  created_at: string;
  name: string | null;
  email: string | null;
}

export function listDriveUsers() {
  return request<DriveAdminUser[]>("/drive/admin/users");
}

export function setUserQuota(userId: string, quotaBytes: number) {
  return request<DriveAdminUser>(`/drive/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ quota_bytes: quotaBytes }),
  });
}

export function recomputeUser(userId: string) {
  return request<DriveAdminUser>(`/drive/admin/users/${userId}/recompute`, {
    method: "POST",
  });
}

export function downloadUrl(id: string) {
  return `/api/drive/files/${id}/content`;
}

export function thumbnailUrl(id: string) {
  return `/api/drive/files/${id}/thumbnail`;
}

export function contentUrlFor(id: string) {
  return `/api/drive/files/${id}/content`;
}
