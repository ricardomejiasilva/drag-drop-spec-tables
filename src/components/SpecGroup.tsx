import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Container } from "../types";
import { useMemo } from "react";
import SortableItem from "./SortableItem";

const SpecGroup = ({
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
        isTranferingRight ? "spec-group select-container" : "spec-group"
      }
      onClick={() => select(columnId)}
    >
      <div className="title-container">
        <p>{columnId === "spec-0" ? "Table" : "Sink"}</p>
      </div>

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
      <div className="footer">
        <p>Drag/drop filters</p>
      </div>
    </div>
  );
};

export default SpecGroup;
