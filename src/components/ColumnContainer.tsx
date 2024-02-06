import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Container } from "../types";
import { useMemo } from "react";
import SortableItem from "./SortableItem";

const ColumnContainer = ({
  tasks,
  count,
  select,
  columnId,
  handleSelect,
  selectedTasks,
  isTranferingRight,
}: Container) => {
  const { setNodeRef } = useSortable({
    id: columnId,
    data: {
      type: "Column",
      columnId,
    },
  });

  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={
        isTranferingRight && columnId !== "left"
          ? "filter-container select-container"
          : "filter-container"
      }
      onClick={() => select(columnId)}
    >
      <SortableContext strategy={rectSortingStrategy} items={tasksIds}>
        {tasks.map((task) =>
          !task.hidden ? (
            <SortableItem
              onSelect={(e) => handleSelect(task.id.toString())}
              selected={selectedTasks.includes(task.id.toString())}
              id={task.id.toString()}
              key={task.id}
              task={task}
              count={count}
            />
          ) : null
        )}
      </SortableContext>
    </div>
  );
}

export default ColumnContainer;
