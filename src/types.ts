export type Id = string | number;

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
};

export type Filters = {
  id: number;
  filterName: string;
};
