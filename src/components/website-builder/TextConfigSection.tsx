
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveIcon } from "lucide-react";

interface TextConfigSectionProps {
  title: string;
  initialValues: {
    heading?: string;
    subheading?: string;
    content?: string;
    alignment?: string;
    size?: string;
  };
  onSave: (values: any) => void;
  onCancel: () => void;
}

export const TextConfigSection = ({
  title,
  initialValues,
  onSave,
  onCancel
}: TextConfigSectionProps) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveClick = () => {
    onSave(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title || "Text konfigurieren"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {initialValues.heading !== undefined && (
            <div className="space-y-2">
              <Label>Überschrift</Label>
              <Input
                value={values.heading}
                onChange={(e) => handleChange("heading", e.target.value)}
              />
            </div>
          )}
          
          {initialValues.subheading !== undefined && (
            <div className="space-y-2">
              <Label>Unterüberschrift</Label>
              <Input
                value={values.subheading}
                onChange={(e) => handleChange("subheading", e.target.value)}
              />
            </div>
          )}
          
          {initialValues.content !== undefined && (
            <div className="space-y-2">
              <Label>Text</Label>
              <Textarea
                value={values.content}
                onChange={(e) => handleChange("content", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          
          {initialValues.alignment !== undefined && (
            <div className="space-y-2">
              <Label>Ausrichtung</Label>
              <Select 
                value={values.alignment} 
                onValueChange={(value) => handleChange("alignment", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ausrichtung wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Links</SelectItem>
                  <SelectItem value="center">Zentriert</SelectItem>
                  <SelectItem value="right">Rechts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {initialValues.size !== undefined && (
            <div className="space-y-2">
              <Label>Größe</Label>
              <Select 
                value={values.size} 
                onValueChange={(value) => handleChange("size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Größe wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Klein</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="large">Groß</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleSaveClick}>
              <SaveIcon className="h-4 w-4 mr-1" />
              Speichern
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
