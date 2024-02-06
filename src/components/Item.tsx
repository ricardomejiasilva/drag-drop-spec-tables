import React, { forwardRef, HTMLAttributes, CSSProperties } from "react";
import { Task } from "../types";

export type ItemProps = HTMLAttributes<HTMLDivElement> & {
  withOpacity?: boolean;
  isDragging?: boolean;
  task: Task;
  onSelect?: (event: React.MouseEvent<HTMLDivElement>) => void;
  selected: boolean | undefined;
  count: number;
};

const Item = forwardRef<HTMLDivElement, ItemProps>(
  (
    {
      withOpacity,
      onSelect,
      count,
      selected,
      task,
      isDragging,
      style,
      ...props
    },
    ref
  ) => {
    const inlineStyles: CSSProperties = {
      transform: isDragging ? "scale(1.05)" : "scale(1)",
      borderColor: isDragging || selected ? "#1890ff" : "",
      ...style,
    };

    return (
      <div
        onClick={onSelect}
        className="filter-item"
        ref={ref}
        style={inlineStyles}
        {...props}
      >
        {task.content}
        {isDragging && count > 1 && (
          <div className="count">
            <p>{count}</p>
          </div>
        )}
      </div>
    );
  }
);

export default Item;
