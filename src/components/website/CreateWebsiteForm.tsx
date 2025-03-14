
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { websiteService } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import TemplatePicker from './TemplatePicker';

const formSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein"),
  url: z.string().min(3, "URL muss mindestens 3 Zeichen lang sein"),
  template: z.string().min(1, "Bitte wähle eine Vorlage aus"),
});

export default function CreateWebsiteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
      template: '',
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const websiteId = await websiteService.createWebsite(
        values.name, 
        values.url,
        values.template
      );
      
      if (websiteId) {
        toast.success("Website erfolgreich erstellt");
        navigate(`/dashboard/website-editor/${websiteId}`);
      } else {
        toast.error("Fehler beim Erstellen der Website");
      }
    } catch (error) {
      console.error("Error creating website:", error);
      toast.error("Fehler beim Erstellen der Website");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    form.setValue('template', templateId);
  };
  
  return (
    <div className="max-w-4xl mx-auto my-8">
      <Card>
        <CardHeader>
          <CardTitle>Neue Website erstellen</CardTitle>
          <CardDescription>Erstelle eine neue Website mit unserem Website-Builder</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website-Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Meine Website" {...field} />
                    </FormControl>
                    <FormDescription>
                      Der Name deiner Website (wird im Dashboard angezeigt)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL-Pfad</FormLabel>
                    <FormControl>
                      <Input placeholder="meine-website" {...field} />
                    </FormControl>
                    <FormDescription>
                      Der URL-Pfad für deine Website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website-Vorlage</FormLabel>
                    <FormControl>
                      <div className="mt-2">
                        <TemplatePicker 
                          onSelect={handleTemplateSelect} 
                          selectedTemplate={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Erstelle Website..." : "Website erstellen"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
