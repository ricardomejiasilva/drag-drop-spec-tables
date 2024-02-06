import React, { FC } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Item, { ItemProps } from "./Item";

const SortableItem: FC<ItemProps> = (props) => {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.task.id,
    data: {
      type: "Task",
      task: props.task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  return (
    <Item
      ref={setNodeRef}
      style={style}
      withOpacity={isDragging}
      {...props}
      {...attributes}
      {...listeners}
    />
  );
};

export default SortableItem;
