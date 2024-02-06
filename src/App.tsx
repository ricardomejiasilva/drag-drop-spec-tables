import "./App.css";
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
  MouseSensor,
  TouchSensor,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Id, Task } from "./types";
import { useEffect, useState } from "react";
import SpecGroup from "./components/SpecGroup";
import Item from "./components/Item";
import { createPortal } from "react-dom";

const defaultTaks: Task[] = [
  {
    id: 1,
    columnId: "left",
    content: "plate",
    hidden: false,
  },
  {
    id: 2,
    columnId: "left",
    content: "fork",
    hidden: false,
  },
  {
    id: 3,
    columnId: "left",
    content: "spoon",
    hidden: false,
  },
  {
    id: 4,
    columnId: "left",
    content: "cup",
    hidden: false,
  },
  {
    id: 5,
    columnId: "left",
    content: "knife",
    hidden: false,
  },
  {
    id: 6,
    columnId: "left",
    content: "jar",
    hidden: false,
  },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(defaultTaks);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTranferingRight, setIsTranferingRight] = useState<boolean>(false);
  const [selectedContainer, setSelectedContainer] = useState<string>("");

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const onSelect = (taskId: string) => {
    setSelectedTasks((selected) => {
      if (selected.includes(taskId)) {
        return selected.filter((id) => id !== taskId);
      } else {
        return [...selected, taskId];
      }
    });
  };

  const handleSelect = (id: string) => {
    setSelectedTasks((selectedIds) => {
      if (selectedIds.includes(id)) {
        return selectedIds.filter((value) => value !== id);
      } else {
        return [...selectedIds, id];
      }
    });
  };

  const select = (columnId: string) => {
    if (isTranferingRight) {
      setSelectedContainer(columnId);
      setIsTranferingRight(false);
    }
  };

  function onDragStart(event: DragStartEvent) {
    setIsDragging(true);

    const taskId = event.active.id.toString();

    setSelectedTasks((selected) => {
      if (!selected.includes(taskId)) {
        return [...selected, taskId];
      }
      return selected;
    });

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        selectedTasks.includes(task.id.toString()) &&
        task.id !== event.active.id
          ? { ...task, hidden: true }
          : task
      )
    );

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (activeId === overId) return;
    if (!isActiveATask) return;

    // Dropping a Task over another Task (sorting between tasks)
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        const overTaskColumnId = tasks[overIndex].columnId;

        // Update columnId for activeTask and selectedTasks to match the overTask's columnId
        const updatedTasks = tasks.map((task) => {
          if (
            task.id === activeId ||
            selectedTasks.includes(task.id.toString())
          ) {
            return { ...task, columnId: overTaskColumnId };
          }
          return task;
        });

        // Move the active task to the new position
        // If there are other selected tasks, place them immediately after the active task
        const finalTasks = arrayMove(updatedTasks, activeIndex, overIndex);
        let lastIndex = overIndex;
        selectedTasks.forEach((taskId) => {
          if (taskId !== activeId) {
            const selectedIndex = finalTasks.findIndex(
              (t) => t.id.toString() === taskId
            );
            if (selectedIndex > -1) {
              const [selectedTask] = finalTasks.splice(selectedIndex, 1);
              finalTasks.splice(lastIndex, 0, selectedTask);
              lastIndex++;
            }
          }
        });

        return finalTasks;
      });
    }

    const isOverAColumn =
      over.data.current?.type === "Column" ||
      over.data.current?.type === "Group";

    // Dropping a Task over a column (needed)
    let useCol: string = "";

    const getTaskColumn = (overId: Id) => {
      if (typeof overId === "number") {
        const newCol = tasks.find((item) => item.id === overId);

        useCol = (newCol?.columnId || "") as string;
      } else {
        useCol = overId.toString();
      }

      return useCol;
    };

    getTaskColumn(overId);

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        if (selectedTasks.length > 0) {
          const updatedTasks = tasks.map((task) => {
            if (selectedTasks.includes(task.id.toString())) {
              return { ...task, columnId: useCol };
            }
            return task;
          });

          return updatedTasks;
        } else {
          tasks[activeIndex].columnId = overId;
          return arrayMove(tasks, activeIndex, activeIndex);
        }
      });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => ({ ...task, hidden: false }))
    );

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    const isActiveAGroup = active.data.current?.type === "Group";
    if (!isActiveAColumn && !isActiveAGroup) return;
  }

  const onDragCancel = () => {
    setActiveTask(null);
  };

  const transferLeft = () => {
    const newTasks = tasks.map((task) => {
      if (selectedTasks.includes(task.id.toString())) {
        return { ...task, columnId: "left" };
      }
      return task;
    });

    setTasks(newTasks);

    setSelectedTasks([]);
  };

  useEffect(() => {
    if (selectedContainer) {
      const newTasks = tasks.map((task) => {
        if (selectedTasks.includes(task.id.toString())) {
          return { ...task, columnId: selectedContainer };
        }
        return task;
      });

      setTasks(newTasks);
      setSelectedTasks([]);
      setSelectedContainer("");
    }
  }, [selectedContainer]);

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
            onDragCancel={onDragCancel}
            collisionDetection={closestCenter}
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
                  onSelect={onSelect}
                  isTranferingRight={isTranferingRight}
                  selectedTasks={selectedTasks}
                  handleSelect={handleSelect}
                  count={selectedTasks.length}
                  select={select}
                />
              </div>
            </div>
            <div className="controls">
              <button
                className="transfer-btn"
                disabled={isTranferingRight}
                onClick={() => setIsTranferingRight(true)}
              >
                {">"}
              </button>
              <button disabled={isTranferingRight} onClick={transferLeft}>
                {"<"}
              </button>
            </div>
            <div
              className={
                isTranferingRight ? "right-col select-area" : "right-col"
              }
            >
              <div className="col-header">
                <p>Custom Spec Table Order</p>
              </div>
              <div className="col-container">
                <SpecGroup
                  key={"spec-0"}
                  columnId={"spec-0"}
                  tasks={tasks.filter((task) => task.columnId === "spec-0")}
                  onSelect={onSelect}
                  isTranferingRight={isTranferingRight}
                  selectedTasks={selectedTasks}
                  handleSelect={handleSelect}
                  count={selectedTasks.length}
                  select={select}
                />
                <SpecGroup
                  key={"spec-1"}
                  columnId={"spec-1"}
                  tasks={tasks.filter((task) => task.columnId === "spec-1")}
                  onSelect={onSelect}
                  isTranferingRight={isTranferingRight}
                  selectedTasks={selectedTasks}
                  handleSelect={handleSelect}
                  count={selectedTasks.length}
                  select={select}
                />
                <ColumnContainer
                  key={"right"}
                  columnId={"right"}
                  tasks={tasks.filter((task) => task.columnId === "right")}
                  onSelect={onSelect}
                  isTranferingRight={isTranferingRight}
                  selectedTasks={selectedTasks}
                  handleSelect={handleSelect}
                  count={selectedTasks.length}
                  select={select}
                />
              </div>
            </div>
            {createPortal(
              <DragOverlay>
                {activeTask ? (
                  <Item
                    selected={selectedTasks.includes(activeTask.id.toString())}
                    task={activeTask}
                    count={selectedTasks.length}
                    isDragging
                  />
                ) : null}
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
