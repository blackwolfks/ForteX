
import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from 'lucide-react';
import TemplatePicker from './TemplatePicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein"),
  url: z.string().min(3, "URL muss mindestens 3 Zeichen lang sein"),
  template: z.string().min(1, "Bitte wähle eine Vorlage aus"),
});

export default function CreateWebsiteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const navigate = useNavigate();
  
  // Check if user is a Pro user
  const { data: proStatus } = useQuery({
    queryKey: ['user-pro-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_pro_status');
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 60000, // 1 minute
  });
  
  useEffect(() => {
    if (proStatus && proStatus.length > 0) {
      setIsProUser(proStatus[0].has_pro || false);
    }
  }, [proStatus]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
      template: '',
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if user is trying to use a Pro-only template without Pro access
    const selectedTemplateData = websiteService.getTemplate(values.template);
    if (selectedTemplateData?.proOnly && !isProUser) {
      toast.error("Diese Vorlage ist nur für Pro-Benutzer verfügbar");
      return;
    }
    
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
    const selectedTemplate = websiteService.getTemplate(templateId);
    
    if (selectedTemplate?.proOnly && !isProUser) {
      toast.error("Diese Vorlage ist nur für Pro-Benutzer verfügbar");
      return;
    }
    
    setSelectedTemplate(templateId);
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
                          includeShopTemplates={true}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isProUser && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Pro-Vorlagen nicht verfügbar</AlertTitle>
                  <AlertDescription>
                    Einige Vorlagen sind nur für Pro-Benutzer verfügbar. Upgraden Sie auf Pro, um Zugriff zu erhalten.
                  </AlertDescription>
                </Alert>
              )}
              
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
