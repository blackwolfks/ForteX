
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { GameServerType, ScriptCategoryType, NewScriptFormData } from "./types";

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScript: (data: NewScriptFormData, files: File[]) => Promise<void>;
  gameServer: GameServerType;
  category: ScriptCategoryType;
}

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name muss mindestens 3 Zeichen lang sein" })
    .max(50, { message: "Name darf maximal 50 Zeichen lang sein" }),
  serverIp: z.string().optional(),
  description: z.string().optional(),
});

const CreateScriptDialog = ({
  open,
  onOpenChange,
  onCreateScript,
  gameServer,
  category,
}: CreateScriptDialogProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      serverIp: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Füge gameServer und category zu den Formulardaten hinzu
      const scriptData: NewScriptFormData = {
        ...values,
        game_server: gameServer,
        category: category,
      };
      
      await onCreateScript(scriptData, files);
      
      form.reset();
      setFiles([]);
      toast.success("Script erfolgreich erstellt");
    } catch (error) {
      console.error("Fehler beim Erstellen des Scripts:", error);
      toast.error("Fehler beim Erstellen des Scripts");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Prüfe, ob die ausgewählte Datei eine ZIP-Datei ist
      const invalidFiles = selectedFiles.filter(file => 
        !(file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip"))
      );
      
      if (invalidFiles.length > 0) {
        toast.error("Es sind nur ZIP-Dateien erlaubt");
        return;
      }
      
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getServerTitle = (): string => {
    const serverNames: Record<GameServerType, string> = {
      'ragemp': 'RageMP',
      'fivem': 'FiveM',
      'altv': 'AltV',
      'minecraft': 'Minecraft'
    };
    
    const categoryNames: Record<ScriptCategoryType, string> = {
      'script': 'Script',
      'clothing': 'Kleidung',
      'vehicle': 'Fahrzeug',
      'mlo': 'MLO',
      'java': 'Java Edition Plugin',
      'bedrock': 'Bedrock Edition Addon'
    };
    
    return `${categoryNames[category]} für ${serverNames[gameServer]} erstellen`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getServerTitle()}</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Script für Ihren Server.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Script Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mein Script" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverIp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server IP (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. 127.0.0.1:30120"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibung des Scripts..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datei-Upload-Bereich */}
            <div className="space-y-2">
              <FormLabel>Dateien (optional, nur ZIP-Dateien)</FormLabel>
              <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".zip"
                  multiple
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p>Klicken Sie hier, um Dateien hochzuladen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nur ZIP-Dateien erlaubt
                  </p>
                </label>
              </div>

              {/* Liste der hochgeladenen Dateien */}
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="overflow-hidden">
                        <p className="truncate text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-turquoise-500 hover:bg-turquoise-600"
              >
                {isSubmitting ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScriptDialog;
