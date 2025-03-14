
import { useEffect, useCallback } from 'react';

type Hotkey = {
  key: string;         // Format: 'mod+z' (mod = Ctrl or Command), 'shift+a', etc.
  callback: () => void;
  enabled?: boolean;   // Optional: whether the hotkey is enabled
  preventDefault?: boolean; // Optional: whether to prevent the default browser action
};

export function useHotkeys(hotkeys: Hotkey[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check modifier keys
      const ctrlOrCmd = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;
      const alt = event.altKey;
      
      // Look through all hotkeys to find a match
      for (const hotkey of hotkeys) {
        // Skip disabled hotkeys
        if (hotkey.enabled === false) continue;
        
        // Parse the key string
        const parts = hotkey.key.toLowerCase().split('+');
        
        // Check if modifiers match
        const needsCtrlOrCmd = parts.includes('mod');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');
        
        // Get the actual key (the last part)
        const targetKey = parts[parts.length - 1];
        
        // Special case for modifier-only keys
        if (targetKey === 'mod' || targetKey === 'shift' || targetKey === 'alt') {
          // This would be a modifier-only hotkey, not currently supported
          continue;
        }
        
        // Convert key to lowercase for case-insensitive matching
        const pressedKey = event.key.toLowerCase();
        
        // Check if this hotkey matches the key event
        if (
          (needsCtrlOrCmd === ctrlOrCmd) &&
          (needsShift === shift) &&
          (needsAlt === alt) &&
          (targetKey === pressedKey)
        ) {
          // Found a match, execute the callback
          if (hotkey.preventDefault) {
            event.preventDefault();
          }
          hotkey.callback();
          break;
        }
      }
    },
    [hotkeys]
  );
  
  useEffect(() => {
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
