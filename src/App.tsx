import "./App.css";
import TaskCard from "./components/TaskCard";
import ColumnContainer from "./components/ColumnContainer";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task } from "./types";
import { useState } from "react";
import { createPortal } from "react-dom";
import SpecGroup from "./components/SpecGroup";

const defaultTaks: Task[] = [
  {
    id: 1,
    columnId: "left",
    content: "plate",
  },
  {
    id: 2,
    columnId: "left",
    content: "fork",
  },
  {
    id: 3,
    columnId: "left",
    content: "spoon",
  },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(defaultTaks);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const moveRight = (taskId: number) => {
    const newTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, columnId: "right" };
      }
      return task;
    });

    setTasks(newTasks);
  };

  const moveLeft = (taskId: number) => {
    const newTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, columnId: "left" };
      }
      return task;
    });

    setTasks(newTasks);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    const isActiveAGroup = active.data.current?.type === "Group";
    if (!isActiveAColumn && !isActiveAGroup) return;

    console.log("DRAG END");
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    console.log(active);

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId != tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";
    const isOverAGroup = over.data.current?.type === "Group";

    // Dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        console.log("DROPPING TASK OVER COLUMN", { activeIndex, overId });
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }

    // Dropping a Task over a group
    if (isActiveATask && isOverAGroup) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = "group";
        console.log("DROPPING TASK OVER GROUP", { activeIndex, overId });
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }

  return (
    <div className="App">
      <div className="results-section">
        <div className="results-header">
          <p>14911 - Kitchen sinks</p>
        </div>

        <div className="results-container">
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
          >
            <div className="left-col">
              <div className="col-header">
                <p>Categories</p>
              </div>
              <div className="col-container">
                <ColumnContainer
                  key={"left"}
                  columnId={"left"}
                  tasks={tasks.filter((task) => task.columnId === "left")}
                />
              </div>
            </div>
            <div className="controls">
              <button onClick={() => moveRight(1)} style={{ margin: 8 }}>
                {">"}
              </button>
              <button onClick={() => moveLeft(1)}>{"<"}</button>
            </div>
            <div className="right-col">
              <div className="col-header">
                <p>Custom Spec Table Order</p>
              </div>
              <div className="col-container">
                <SpecGroup
                  key={"group-0"}
                  columnId={"group-0"}
                  tasks={tasks.filter((task) => task.columnId === "group-0")}
                />
                <SpecGroup
                  key={"group-1"}
                  columnId={"group-1"}
                  tasks={tasks.filter((task) => task.columnId === "group-1")}
                />
                <ColumnContainer
                  key={"right"}
                  columnId={"right"}
                  tasks={tasks.filter((task) => task.columnId === "right")}
                />
              </div>
            </div>
            {createPortal(
              <DragOverlay>
                {activeTask && <TaskCard task={activeTask} />}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </div>
      </div>
    </div>
  );
}

export default App;
