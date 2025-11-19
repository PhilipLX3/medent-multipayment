import React, { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

// Fix for react-beautiful-dnd with React 18 StrictMode
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Ensure the component is mounted before enabling
    const animation = requestAnimationFrame(() => {
      setEnabled(true);
    });

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    // Return null to avoid any rendering issues during initialization
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};