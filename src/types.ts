export type Id = string | number;

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  hidden?: boolean;
};

export type Container = {
  tasks: Task[];
  count: number;
  columnId: string;
  selectedTasks: string[];
  isTranferingRight: boolean;
  select: (value: string) => void;
  onSelect: (value: string) => void;
  handleSelect: (value: string) => void;
}
