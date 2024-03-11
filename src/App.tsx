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
import { defaultTaks } from "./components/TaskList";

function App() {
  const [tasks, setTasks] = useState<Task[]>(defaultTaks);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTranferingRight, setIsTranferingRight] = useState<boolean>(false);
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    // Find the index of the task that's being dragged
    const taskIndex = tasks.findIndex((task) => task.id.toString() === taskId);

    // Determine if the task is already selected
    const isTaskSelected = selectedTasks.includes(taskId);

    // Calculate yOffset only if the task is already selected
    let yOffset = 0;
    if (isTaskSelected) {
      const firstSelectedIndex = tasks.findIndex((task) =>
        selectedTasks.includes(task.id.toString())
      );
      yOffset = (taskIndex - firstSelectedIndex) * 42; // Example task height, adjust accordingly
    }

    setDragOffset({ x: 0, y: yOffset });

    // Select the task if it's not already selected
    if (!isTaskSelected) {
      setSelectedTasks([taskId]);
    }

    // Hide other selected tasks if necessary
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (
          selectedTasks.length > 1 &&
          selectedTasks.includes(task.id.toString()) &&
          task.id !== event.active.id
        ) {
          return { ...task, hidden: true };
        } else {
          return task;
        }
      })
    );

    // Set activeTask for DragOverlay
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
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
        const overIndex = tasks.findIndex((t) => t.id === overId);

        // Adjusted logic to reorder tasks
        let updatedTasks = [...tasks];
        const movingTasks = updatedTasks.filter((task) =>
          selectedTasks.includes(task.id.toString())
        );

        // Remove selected tasks from their current positions
        updatedTasks = updatedTasks.filter(
          (task) => !selectedTasks.includes(task.id.toString())
        );

        // Determine new index for insertion
        let newIndex = updatedTasks.findIndex((t) => t.id === overId);
        const initialIndex = newIndex;

        const overTaskIndex = tasks.findIndex((t) => t.id === overId);
        const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);

        if (newIndex === -1) {
          // If overId not found in the list, calculate the index based on position
          newIndex = tasks.findIndex((t) => t.id === overId);
        } else {
          // If overId found, check if dragging below it, then increment newIndex
          if (activeTaskIndex > overTaskIndex) {
            // If dragging the task downwards, decrement newIndex
            newIndex--;
          }
        }

        if (activeTaskIndex === 0) {
          newIndex--;
        }

        if (
          event.active.data?.current?.task?.columnId !==
          event.over?.data?.current?.task?.columnId
        ) {
          // Extract the numeric part from the columnId
          const extractNumber = (columnId: string) => {
            return parseInt(columnId.split("-")[1]);
          };

          // Get the numeric values of active and over columnIds
          const activeColumnIdNumber = extractNumber(
            event.active.data?.current?.task?.columnId
          );
          const overColumnIdNumber = extractNumber(
            event.over?.data?.current?.task?.columnId
          );

          // Perform the comparison and adjust newIndex accordingly
          if (activeColumnIdNumber < overColumnIdNumber) {
            newIndex--;
          }

          if (activeColumnIdNumber > overColumnIdNumber) {
            newIndex++;
          }

          if (
            event.active.data?.current?.task?.columnId === "right" &&
            event.over?.data?.current?.task?.columnId !== "right"
          ) {
            newIndex++;
          }

          if (
            event.active.data?.current?.task?.columnId !== "right" &&
            event.over?.data?.current?.task?.columnId === "right"
          ) {
            newIndex--;
          }

          if (
            event.active.data?.current?.task?.columnId !== "left" &&
            event.over?.data?.current?.task?.columnId === "left"
          ) {
            if (initialIndex !== newIndex + 1) {
              newIndex--;
            }
          }

          if (
            event.active.data?.current?.task?.columnId === "left" &&
            event.over?.data?.current?.task?.columnId !== "left"
          ) {
            if (initialIndex !== newIndex + 1) {
              newIndex--;
            }
          }
        }

        // Correctly splice in the moving tasks
        updatedTasks.splice(newIndex + 1, 0, ...movingTasks);

        // Update columnId for all tasks being moved
        updatedTasks = updatedTasks.map((task) => {
          if (selectedTasks.includes(task.id.toString())) {
            return { ...task, columnId: tasks[overIndex].columnId };
          }
          return task;
        });

        return updatedTasks;
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
    setSelectedTasks([])

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
                  <div style={{ transform: `translateY(${dragOffset.y}px)` }}>
                    <Item
                      selected={selectedTasks.includes(
                        activeTask.id.toString()
                      )}
                      task={activeTask}
                      count={selectedTasks.length}
                      isDragging
                    />
                  </div>
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
