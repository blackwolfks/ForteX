
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWebsite: (name: string, template: string) => Promise<void>;
  isCreating: boolean;
}

export function NewWebsiteDialog({ open, onOpenChange, onCreateWebsite, isCreating }: NewWebsiteDialogProps) {
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [newWebsiteTemplate, setNewWebsiteTemplate] = useState("E-Commerce");

  const handleSubmit = async () => {
    await onCreateWebsite(newWebsiteName, newWebsiteTemplate);
    setNewWebsiteName("");
    setNewWebsiteTemplate("E-Commerce");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Website erstellen</DialogTitle>
          <DialogDescription>
            Geben Sie die Grundinformationen für Ihre neue Website ein.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name der Website</Label>
            <Input 
              id="name" 
              placeholder="Meine neue Website" 
              value={newWebsiteName}
              onChange={(e) => setNewWebsiteName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={newWebsiteTemplate} onValueChange={setNewWebsiteTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Template auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E-Commerce">Online-Shop</SelectItem>
                <SelectItem value="Portfolio">Portfolio</SelectItem>
                <SelectItem value="Blog">Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !newWebsiteName.trim()}>
            {isCreating ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
