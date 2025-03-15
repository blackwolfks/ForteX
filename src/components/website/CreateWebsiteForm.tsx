
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
import { AlertTriangleIcon, RocketIcon, PaintbrushIcon, CheckCircleIcon, Lock } from 'lucide-react';
import TemplatePicker from './TemplatePicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { templateService } from '@/services/website/templates';

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
    try {
      const selectedTemplateData = await templateService.getTemplate(values.template);
      if (selectedTemplateData?.proOnly && !isProUser) {
        toast.error("Diese Vorlage ist nur für Pro-Benutzer verfügbar");
        return;
      }
      
      setIsSubmitting(true);
      
      // 1. Create the website
      const websiteId = await websiteService.createWebsite(
        values.name, 
        values.url,
        values.template
      );
      
      if (websiteId) {
        // 2. Get default content for the selected template
        const getContentFn = templateService.getTemplateDefaultContent(values.template);
        const defaultContent = await getContentFn();
        
        // 3. Save the default content to the new website
        if (defaultContent && Object.keys(defaultContent).length > 0) {
          await websiteService.saveWebsiteContent(websiteId, defaultContent);
        }
        
        toast.success("Website erfolgreich erstellt", {
          description: "Sie werden zum Website-Editor weitergeleitet.",
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
        });
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
  
  const handleTemplateSelect = async (templateId: string) => {
    try {
      const selectedTemplate = await templateService.getTemplate(templateId);
      
      if (selectedTemplate?.proOnly && !isProUser) {
        toast.error("Diese Vorlage ist nur für Pro-Benutzer verfügbar", {
          description: "Upgraden Sie auf Pro, um Zugriff zu erhalten",
          icon: <Lock className="h-5 w-5 text-orange-500" />
        });
        return;
      }
      
      setSelectedTemplate(templateId);
      form.setValue('template', templateId);
      toast.success(`"${selectedTemplate?.name}" ausgewählt`, {
        icon: <PaintbrushIcon className="h-5 w-5 text-primary" />
      });
    } catch (error) {
      console.error("Error selecting template:", error);
      toast.error("Fehler beim Auswählen der Vorlage");
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto my-8">
      <Card className="dark-card">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <RocketIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Website erstellen</CardTitle>
          </div>
          <CardDescription className="text-base">
            Erstellen Sie Ihre eigene professionelle Website mit unserem Website-Builder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website-Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Meine Website" 
                          {...field}
                          className="input-focus" 
                        />
                      </FormControl>
                      <FormDescription>
                        Der Name Ihrer Website (wird im Dashboard angezeigt)
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
                        <Input 
                          placeholder="meine-website" 
                          {...field} 
                          className="input-focus"
                        />
                      </FormControl>
                      <FormDescription>
                        Der URL-Pfad für Ihre Website (ohne Sonderzeichen)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website-Vorlage</FormLabel>
                    <FormDescription className="text-base mb-4">
                      Wählen Sie eine Vorlage aus, die perfekt zu Ihrem Projekt passt.
                      Jede Vorlage kommt mit vordefinierten Inhalten und einem einzigartigen Design.
                    </FormDescription>
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
                <Alert variant="default" className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                  <AlertTitle className="text-amber-500">Premium-Vorlagen nicht verfügbar</AlertTitle>
                  <AlertDescription>
                    Einige Vorlagen sind nur für Pro-Benutzer verfügbar. Upgraden Sie auf Pro, um Zugriff auf alle Premium-Designs zu erhalten.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full turquoise-gradient" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse mr-2">●</span>
                    Website wird erstellt...
                  </>
                ) : (
                  <>
                    Website erstellen
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
