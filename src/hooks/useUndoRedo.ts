import { useState, useCallback, useRef } from 'react';

type HistoryItem<T> = {
  state: T;
  timestamp: number;
};

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Using refs for history to avoid re-renders on history changes
  const historyRef = useRef<HistoryItem<T>[]>([{ state: initialState, timestamp: Date.now() }]);
  const indexRef = useRef<number>(0);
  
  // Update state and add to history
  const update = useCallback((newState: T) => {
    // Create a new history entry
    const newItem: HistoryItem<T> = {
      state: newState,
      timestamp: Date.now()
    };
    
    // If we're not at the end of history, remove future entries
    if (indexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    }
    
    // Add new entry and update index
    historyRef.current.push(newItem);
    indexRef.current = historyRef.current.length - 1;
    
    // Update state and undo/redo availability
    setState(newState);
    setCanUndo(indexRef.current > 0);
    setCanRedo(false);
  }, []);
  
  // Undo to previous state
  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--;
      setState(historyRef.current[indexRef.current].state);
      setCanUndo(indexRef.current > 0);
      setCanRedo(true);
    }
  }, []);
  
  // Redo to next state
  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      setState(historyRef.current[indexRef.current].state);
      setCanUndo(true);
      setCanRedo(indexRef.current < historyRef.current.length - 1);
    }
  }, []);
  
  // Clear history but keep current state
  const clearHistory = useCallback(() => {
    const currentState = historyRef.current[indexRef.current].state;
    historyRef.current = [{ state: currentState, timestamp: Date.now() }];
    indexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []);
  
  return {
    state,
    update,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  };
}
