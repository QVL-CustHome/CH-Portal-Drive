import { CanopApiError, createApiClient } from "canopui";

const client = createApiClient({ basePath: "/api", withRefresh: true });

export const request = client.request;
export { CanopApiError as ApiError };
