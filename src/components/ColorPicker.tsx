
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Droplet } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

// Lista de cores predefinidas
const presetColors = [
  "#FF5252", // Vermelho
  "#FF4081", // Rosa
  "#7C4DFF", // Roxo
  "#536DFE", // Índigo
  "#448AFF", // Azul
  "#40C4FF", // Azul claro
  "#18FFFF", // Ciano
  "#64FFDA", // Verde-água
  "#69F0AE", // Verde claro
  "#B2FF59", // Lima
  "#EEFF41", // Amarelo
  "#FFD740", // Âmbar
  "#FFAB40", // Laranja
  "#FF6E40", // Laranja profundo
  "#808080", // Cinza
  "#212121", // Preto
];

const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentColor(color);
  }, [color]);

  const handleChange = (newColor: string) => {
    setCurrentColor(newColor);
    onChange(newColor);
  };

  const handleSelectPreset = (preset: string) => {
    handleChange(preset);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-10 h-10 p-0 border-2"
              style={{ backgroundColor: currentColor, borderColor: "#00000033" }}
            >
              <span className="sr-only">Selecionar cor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <div>
                <Label>Cores predefinidas</Label>
                <div className="grid grid-cols-8 gap-1 mt-1">
                  {presetColors.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-200 shadow-sm"
                      style={{ backgroundColor: presetColor }}
                      onClick={() => handleSelectPreset(presetColor)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="custom-color">Cor personalizada</Label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="color"
                      id="custom-color"
                      value={currentColor}
                      onChange={(e) => handleChange(e.target.value)}
                      className="sr-only"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 h-8 pl-2 pr-3"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Droplet className="h-4 w-4" />
                      <span>Selecionar</span>
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={currentColor}
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-8 w-24"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          type="text"
          value={currentColor}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
