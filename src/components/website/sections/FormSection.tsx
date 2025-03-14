
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
}

export default function FormSection({ 
  section, 
  isEditing, 
  onUpdate 
}: FormSectionProps) {
  const {
    title = 'Kontaktformular',
    fields = [
      { id: 'field-1', type: 'text', label: 'Name', required: true },
      { id: 'field-2', type: 'email', label: 'E-Mail', required: true },
      { id: 'field-3', type: 'textarea', label: 'Nachricht', required: true }
    ],
    buttonText = 'Absenden',
    successMessage = 'Vielen Dank für Ihre Nachricht!',
    errorMessage = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
  } = section.content;
  
  const addField = () => {
    const newField: FormField = {
      id: uuidv4(),
      type: 'text',
      label: 'Neues Feld',
      required: false
    };
    
    onUpdate({ fields: [...fields, newField] });
  };
  
  const updateField = (id: string, fieldData: Partial<FormField>) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, ...fieldData } : field
    );
    
    onUpdate({ fields: updatedFields });
  };
  
  const removeField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    onUpdate({ fields: updatedFields });
  };
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Formular-Titel</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
            />
          </div>
          
          <div className="space-y-4">
            <Label>Formularfelder</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md bg-muted/30">
                <div className="cursor-move mt-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`field-${field.id}-label`}>Feldbezeichnung</Label>
                      <Input
                        id={`field-${field.id}-label`}
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`field-${field.id}-type`}>Feldtyp</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio') => 
                          updateField(field.id, { type: value })
                        }
                      >
                        <SelectTrigger id={`field-${field.id}-type`}>
                          <SelectValue placeholder="Feldtyp auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">E-Mail</SelectItem>
                          <SelectItem value="textarea">Textbereich</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio-Button</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Label 
                      htmlFor={`field-${field.id}-required`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        id={`field-${field.id}-required`}
                        type="checkbox" 
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="h-4 w-4"
                      />
                      Pflichtfeld
                    </Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addField}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Feld hinzufügen
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buttonText">Button-Text</Label>
            <Input 
              id="buttonText" 
              value={buttonText} 
              onChange={(e) => onUpdate({ buttonText: e.target.value })} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="successMessage">Erfolgsmeldung</Label>
              <Textarea 
                id="successMessage" 
                value={successMessage} 
                onChange={(e) => onUpdate({ successMessage: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="errorMessage">Fehlermeldung</Label>
              <Textarea 
                id="errorMessage" 
                value={errorMessage} 
                onChange={(e) => onUpdate({ errorMessage: e.target.value })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // The rendering view of the section
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <form className="space-y-6">
          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === 'textarea' ? (
                <Textarea id={field.id} placeholder={field.placeholder} required={field.required} />
              ) : field.type === 'select' ? (
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    )) || <SelectItem value="option">Option</SelectItem>}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={field.id} className="h-4 w-4" />
                  <Label htmlFor={field.id}>{field.placeholder || 'Ich stimme zu'}</Label>
                </div>
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {field.options?.map(option => (
                    <div key={option} className="flex items-center gap-2">
                      <input type="radio" id={`${field.id}-${option}`} name={field.id} className="h-4 w-4" />
                      <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                    </div>
                  )) || (
                    <div className="flex items-center gap-2">
                      <input type="radio" id={`${field.id}-option`} name={field.id} className="h-4 w-4" />
                      <Label htmlFor={`${field.id}-option`}>Option</Label>
                    </div>
                  )}
                </div>
              ) : (
                <Input 
                  id={field.id} 
                  type={field.type} 
                  placeholder={field.placeholder} 
                  required={field.required} 
                />
              )}
            </div>
          ))}
          
          <Button type="submit" className="mt-4">{buttonText}</Button>
        </form>
      </div>
    </div>
  );
}
