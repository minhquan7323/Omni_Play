import { DraggableLocation, DropResult } from '@hello-pangea/dnd';

export type DndActionHandler = (source: DraggableLocation, destination: DraggableLocation, result: DropResult) => void;
export type DragScenarioMap = Record<string, DndActionHandler>;

export const createDndHandler = (scenarios: DragScenarioMap) => {
    return (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        const scenarioKey = `${source.droppableId}->${destination.droppableId}`;
        const handler = scenarios[scenarioKey];

        if (handler) handler(source, destination, result);
    };
};