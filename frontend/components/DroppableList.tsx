'use client';

import { Draggable, DraggableProvided, DraggableStateSnapshot, Droppable } from '@hello-pangea/dnd';
import React from 'react';
import { DraggableItemsRegistry } from '@/constants/dnd.constant';

interface DroppableListProps<T> {
    droppableId: string;
    items: T[];
    keyExtractor: (item: T, index: number) => string;
    renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
    containerClassName?: string;
    getItemClassName?: (isDragging: boolean) => string;
    direction?: 'vertical' | 'horizontal';
    isDropDisabled?: boolean;
    renderClone?: (item: T, provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement;
    keepOriginal?: boolean;
    placeholderClassName?: string;
}

export function DroppableList<T>({
    droppableId,
    items,
    keyExtractor,
    renderItem,
    containerClassName = '',
    getItemClassName,
    direction = 'vertical',
    isDropDisabled = false,
    renderClone,
    keepOriginal = false,
    placeholderClassName = '',
}: DroppableListProps<T>) {
    return (
        <Droppable
            droppableId={droppableId}
            direction={direction}
            isDropDisabled={isDropDisabled}
            renderClone={
                renderClone
                    ? (provided, snapshot, rubric) => {
                        const element = renderClone(items[rubric.source.index], provided, snapshot) as React.ReactElement<any>;
                        return React.cloneElement(element, {
                            ref: provided.innerRef,
                            ...provided.draggableProps,
                            ...provided.dragHandleProps,
                            style: {
                                ...(element.props.style ?? {}),
                                ...provided.draggableProps.style,
                                margin: 0,
                            },
                        });
                    }
                    : undefined
            }
        >
            {(provided, droppableSnapshot) => {
                const draggingFromThisId = droppableSnapshot.draggingFromThisWith;

                return (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={containerClassName}
                    >
                        {items.map((item, index) => {
                            const key = keyExtractor(item, index);
                            DraggableItemsRegistry[key] = item;

                            if (keepOriginal) {

                                const isThisBeingDragged = draggingFromThisId === key;

                                return (

                                    <div
                                        key={key}
                                        className="shrink-0"
                                        style={{ display: 'grid' }}
                                    >
                                        <div
                                            aria-hidden="true"
                                            className={getItemClassName?.(false)}
                                            style={{
                                                gridArea: '1 / 1',
                                                pointerEvents: 'none',
                                                visibility: isThisBeingDragged ? 'visible' : 'hidden',
                                            }}
                                        >
                                            {renderItem(item, index, false)}
                                        </div>

                                        <Draggable draggableId={key} index={index}>
                                            {(draggableProvided, draggableSnapshot) => (
                                                <div
                                                    ref={draggableProvided.innerRef}
                                                    {...draggableProvided.draggableProps}
                                                    {...draggableProvided.dragHandleProps}
                                                    style={{
                                                        ...draggableProvided.draggableProps.style,
                                                        gridArea: '1 / 1',
                                                        zIndex: 1,
                                                        transform: 'none',
                                                        transition: 'none',
                                                        opacity: isThisBeingDragged ? 0 : 1,
                                                    }}
                                                >
                                                    {renderItem(item, index, draggableSnapshot.isDragging)}
                                                </div>
                                            )}
                                        </Draggable>
                                    </div>
                                );
                            }

                            return (
                                <Draggable key={key} draggableId={key} index={index}>
                                    {(draggableProvided, draggableSnapshot) => (
                                        <div
                                            ref={draggableProvided.innerRef}
                                            {...draggableProvided.draggableProps}
                                            {...draggableProvided.dragHandleProps}
                                            className={getItemClassName?.(draggableSnapshot.isDragging)}
                                            style={draggableProvided.draggableProps.style}
                                        >
                                            {renderItem(item, index, draggableSnapshot.isDragging)}
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}

                        <div className={keepOriginal ? 'hidden' : placeholderClassName}>
                            {provided.placeholder}
                        </div>
                    </div>
                );
            }}
        </Droppable>
    );
}
