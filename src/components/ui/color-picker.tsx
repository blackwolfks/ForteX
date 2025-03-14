
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputColor, setInputColor] = useState(color);
  
  const handleChange = (newColor: string) => {
    setInputColor(newColor);
    onChange(newColor);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          <div 
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <Input 
            value={inputColor} 
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2">
            {['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', 
              '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
              '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b',
              '#000000', '#ffffff', '#9e9e9e', '#607d8b'].map((presetColor) => (
              <div 
                key={presetColor}
                className="w-6 h-6 rounded-full border cursor-pointer"
                style={{ backgroundColor: presetColor }}
                onClick={() => handleChange(presetColor)}
              />
            ))}
          </div>
          
          <div className="pt-2">
            <Input 
              type="color"
              value={inputColor}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-10"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
