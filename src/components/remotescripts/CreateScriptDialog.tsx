
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
      // Make sure name is not empty (it should already be validated by zod)
      if (!values.name || values.name.trim() === "") {
        toast.error("Script Name ist erforderlich");
        setIsSubmitting(false);
        return;
      }
      
      // Füge gameServer und category zu den Formulardaten hinzu
      const scriptData: NewScriptFormData = {
        name: values.name.trim(), // Ensure name is provided and trimmed
        serverIp: values.serverIp,
        description: values.description,
        game_server: gameServer,
        category: category,
      };
      
      // Pass empty array for files since we've removed the upload functionality
      await onCreateScript(scriptData, []);
      
      form.reset();
      toast.success("Script erfolgreich erstellt");
    } catch (error) {
      console.error("Fehler beim Erstellen des Scripts:", error);
      toast.error("Fehler beim Erstellen des Scripts");
    } finally {
      setIsSubmitting(false);
    }
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
