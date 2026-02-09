export type PageMeta = {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type Page<TItem> = {
  items: TItem[];
  meta: PageMeta;
};
