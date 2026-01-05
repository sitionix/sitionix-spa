export type ApiError = {
  code: number;
  title: string;
  details: string;
  traceId?: string;
};
