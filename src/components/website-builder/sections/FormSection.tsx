
import { WebsiteSection, FormConfig, FormField } from '@/services/website-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';

interface FormSectionProps {
  section: WebsiteSection;
  forms: FormConfig[];
  onUpdate: (updates: Partial<WebsiteSection>) => void;
}

export function FormSection({ section, forms, onUpdate }: FormSectionProps) {
  const [isEditingField, setIsEditingField] = useState(false);
  const [currentField, setCurrentField] = useState<FormField | null>(null);
  const [formId, setFormId] = useState<string>(section.formId || '');
  
  const { websiteContent, saveContent } = useWebsiteBuilder();
  
  const selectedForm = forms.find(form => form.id === formId);
  
  const handleFormSelect = (id: string) => {
    setFormId(id);
    onUpdate({ formId: id });
  };
  
  const handleCreateNewForm = () => {
    if (!websiteContent) return;
    
    const newForm: FormConfig = {
      id: crypto.randomUUID(),
      name: 'Neues Formular',
      fields: [],
      submitButtonText: 'Absenden',
      successMessage: 'Vielen Dank für Ihre Nachricht!'
    };
    
    const updatedForms = [...forms, newForm];
    websiteContent.forms = updatedForms;
    
    saveContent();
    
    // Select the new form
    setFormId(newForm.id);
    onUpdate({ formId: newForm.id });
  };
  
  const handleUpdateForm = (updates: Partial<FormConfig>) => {
    if (!websiteContent || !selectedForm) return;
    
    const updatedForm = { ...selectedForm, ...updates };
    const updatedForms = forms.map(form => 
      form.id === formId ? updatedForm : form
    );
    
    websiteContent.forms = updatedForms;
    saveContent();
  };
  
  const handleAddField = () => {
    if (!selectedForm) return;
    
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Neues Feld',
      placeholder: 'Platzhalter',
      required: false
    };
    
    setCurrentField(newField);
    setIsEditingField(true);
  };
  
  const handleEditField = (field: FormField) => {
    setCurrentField({ ...field });
    setIsEditingField(true);
  };
  
  const handleSaveField = () => {
    if (!selectedForm || !currentField || !websiteContent) return;
    
    const isNewField = !selectedForm.fields.some(field => field.id === currentField.id);
    
    let updatedFields: FormField[];
    if (isNewField) {
      updatedFields = [...selectedForm.fields, currentField];
    } else {
      updatedFields = selectedForm.fields.map(field => 
        field.id === currentField.id ? currentField : field
      );
    }
    
    const updatedForm = { ...selectedForm, fields: updatedFields };
    const updatedForms = forms.map(form => 
      form.id === formId ? updatedForm : form
    );
    
    websiteContent.forms = updatedForms;
    saveContent();
    
    setIsEditingField(false);
    setCurrentField(null);
  };
  
  const handleDeleteField = (fieldId: string) => {
    if (!selectedForm || !websiteContent) return;
    
    const updatedFields = selectedForm.fields.filter(field => field.id !== fieldId);
    const updatedForm = { ...selectedForm, fields: updatedFields };
    const updatedForms = forms.map(form => 
      form.id === formId ? updatedForm : form
    );
    
    websiteContent.forms = updatedForms;
    saveContent();
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Formular auswählen</Label>
        <div className="flex gap-2">
          <Select value={formId} onValueChange={handleFormSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Formular auswählen" />
            </SelectTrigger>
            <SelectContent>
              {forms.map(form => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleCreateNewForm}>
            <Plus className="h-4 w-4 mr-2" />
            Neu
          </Button>
        </div>
      </div>
      
      {selectedForm && (
        <>
          <div className="space-y-4 border p-4 rounded-md">
            <div className="space-y-2">
              <Label htmlFor="formName">Formularname</Label>
              <Input
                id="formName"
                value={selectedForm.name}
                onChange={(e) => handleUpdateForm({ name: e.target.value })}
                placeholder="Formularname"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="submitButtonText">Text für Absende-Button</Label>
              <Input
                id="submitButtonText"
                value={selectedForm.submitButtonText}
                onChange={(e) => handleUpdateForm({ submitButtonText: e.target.value })}
                placeholder="Absenden"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="successMessage">Erfolgsmeldung</Label>
              <Textarea
                id="successMessage"
                value={selectedForm.successMessage}
                onChange={(e) => handleUpdateForm({ successMessage: e.target.value })}
                placeholder="Vielen Dank für Ihre Nachricht!"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailNotification">E-Mail-Benachrichtigung (optional)</Label>
              <Input
                id="emailNotification"
                value={selectedForm.emailNotification || ''}
                onChange={(e) => handleUpdateForm({ emailNotification: e.target.value })}
                placeholder="email@beispiel.de"
                type="email"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Formularfelder</Label>
              <Button variant="outline" size="sm" onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Feld hinzufügen
              </Button>
            </div>
            
            {selectedForm.fields.length === 0 ? (
              <div className="text-center p-8 border rounded-md">
                <p className="text-muted-foreground">Keine Felder vorhanden. Fügen Sie Felder hinzu, um Ihr Formular zu gestalten.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feldtyp</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Pflichtfeld</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedForm.fields.map(field => (
                    <TableRow key={field.id}>
                      <TableCell>{getFieldTypeLabel(field.type)}</TableCell>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>{field.required ? 'Ja' : 'Nein'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
      
      <Dialog open={isEditingField} onOpenChange={setIsEditingField}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentField && selectedForm?.fields.some(f => f.id === currentField.id) 
                ? 'Feld bearbeiten' 
                : 'Neues Feld hinzufügen'}
            </DialogTitle>
          </DialogHeader>
          
          {currentField && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fieldType">Feldtyp</Label>
                <Select 
                  value={currentField.type} 
                  onValueChange={(value: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio') => 
                    setCurrentField({ ...currentField, type: value })
                  }
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Feldtyp auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Textfeld</SelectItem>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="textarea">Textbereich</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="radio">Radiobutton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fieldLabel">Bezeichnung</Label>
                <Input
                  id="fieldLabel"
                  value={currentField.label}
                  onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                  placeholder="Feldbezeichnung"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fieldPlaceholder">Platzhalter</Label>
                <Input
                  id="fieldPlaceholder"
                  value={currentField.placeholder || ''}
                  onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                  placeholder="Platzhaltertext"
                />
              </div>
              
              {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
                <div className="space-y-2">
                  <Label htmlFor="fieldOptions">Optionen (durch Komma getrennt)</Label>
                  <Textarea
                    id="fieldOptions"
                    value={currentField.options?.join(', ') || ''}
                    onChange={(e) => setCurrentField({ 
                      ...currentField, 
                      options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt !== '')
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={currentField.required}
                  onCheckedChange={(checked) => setCurrentField({ ...currentField, required: checked })}
                />
                <Label htmlFor="required">Pflichtfeld</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingField(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveField}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getFieldTypeLabel(type: string): string {
  switch (type) {
    case 'text': return 'Textfeld';
    case 'email': return 'E-Mail';
    case 'textarea': return 'Textbereich';
    case 'select': return 'Dropdown';
    case 'checkbox': return 'Checkbox';
    case 'radio': return 'Radiobutton';
    default: return type;
  }
}
