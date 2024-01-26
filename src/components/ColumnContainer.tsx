import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { Task } from "../types";
import { useMemo } from "react";
import TaskCard from "./TaskCard";

interface Props {
  columnId: string;
  tasks: Task[];
}

function ColumnContainer({ columnId, tasks }: Props) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const { setNodeRef } = useSortable({
    id: columnId,
    data: {
      type: "Column",
      columnId,
    },
  });

  return (
    <div ref={setNodeRef} className="filter-container">

      <SortableContext items={tasksIds}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}

export default ColumnContainer;
