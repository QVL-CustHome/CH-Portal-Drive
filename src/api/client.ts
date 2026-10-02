import { CanopApiError, createApiClient } from "@canop/ui";

const client = createApiClient({ basePath: "/api", withRefresh: true });

export const request = client.request;
export { CanopApiError as ApiError };
