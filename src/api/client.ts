import { ApiError, createApiClient } from "@custhome/ui";

const client = createApiClient({ basePath: "/api", withRefresh: true });

export const request = client.request;
export { ApiError };
