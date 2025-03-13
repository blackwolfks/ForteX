
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Settings, 
  Users, 
  BarChart 
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="px-2 py-3">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Übersicht" isActive={activeTab === "overview"}>
                  <a onClick={() => setActiveTab("overview")}>
                    <LayoutDashboard />
                    <span>Übersicht</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Produkte" isActive={activeTab === "products"}>
                  <a onClick={() => setActiveTab("products")}>
                    <Package />
                    <span>Produkte</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Zahlungen" isActive={activeTab === "payments"}>
                  <a onClick={() => setActiveTab("payments")}>
                    <CreditCard />
                    <span>Zahlungen</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Kunden" isActive={activeTab === "customers"}>
                  <a onClick={() => setActiveTab("customers")}>
                    <Users />
                    <span>Kunden</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Statistiken" isActive={activeTab === "analytics"}>
                  <a onClick={() => setActiveTab("analytics")}>
                    <BarChart />
                    <span>Statistiken</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Einstellungen" isActive={activeTab === "settings"}>
                  <a onClick={() => setActiveTab("settings")}>
                    <Settings />
                    <span>Einstellungen</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">E-Commerce v1.0</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="w-full">
            <header className="bg-background border-b border-border">
              <div className="p-4 flex items-center">
                <SidebarTrigger className="mr-2" />
                <h1 className="text-xl font-bold">
                  {activeTab === "overview" && "Übersicht"}
                  {activeTab === "products" && "Produkte"}
                  {activeTab === "payments" && "Zahlungen"}
                  {activeTab === "customers" && "Kunden"}
                  {activeTab === "analytics" && "Statistiken"}
                  {activeTab === "settings" && "Einstellungen"}
                </h1>
              </div>
            </header>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Gesamtumsatz</CardTitle>
                        <CardDescription>Letzten 30 Tage</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">€0,00</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Bestellungen</CardTitle>
                        <CardDescription>Letzten 30 Tage</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">0</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Neue Kunden</CardTitle>
                        <CardDescription>Letzten 30 Tage</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">0</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Letzte Aktivitäten</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Keine Aktivitäten vorhanden.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "products" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Produktübersicht</CardTitle>
                      <CardDescription>Verwalten Sie Ihre Produkte</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Keine Produkte vorhanden. Erstellen Sie Ihr erstes Produkt.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Zahlungsübersicht</CardTitle>
                      <CardDescription>Übersicht aller Zahlungen</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Keine Zahlungen vorhanden.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "customers" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kundenübersicht</CardTitle>
                      <CardDescription>Verwalten Sie Ihre Kunden</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Keine Kunden vorhanden.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistiken</CardTitle>
                      <CardDescription>Detaillierte Verkaufsanalysen</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Keine Daten vorhanden.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Einstellungen</CardTitle>
                      <CardDescription>Verwalten Sie Ihre Kontoeinstellungen</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="account">
                        <TabsList>
                          <TabsTrigger value="account">Konto</TabsTrigger>
                          <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
                          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account" className="mt-4">
                          <p className="text-muted-foreground">Kontoeinstellungen werden hier angezeigt.</p>
                        </TabsContent>
                        <TabsContent value="appearance" className="mt-4">
                          <p className="text-muted-foreground">Hier können Sie das Erscheinungsbild anpassen.</p>
                        </TabsContent>
                        <TabsContent value="notifications" className="mt-4">
                          <p className="text-muted-foreground">Benachrichtigungseinstellungen werden hier angezeigt.</p>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
