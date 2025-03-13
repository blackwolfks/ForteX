
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
  BarChart,
  PlusCircle,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import WebsiteBuilderView from "@/components/website-builder/WebsiteBuilderView";
import ProductsView from "@/components/products/ProductsView";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split('/');
  const activeTab = pathSegments[2] || "overview";

  const navigateTo = (tab: string) => {
    navigate(`/dashboard/${tab}`);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900">
        <Sidebar className="border-r border-slate-200 dark:border-slate-800">
          <SidebarHeader>
            <div className="px-4 py-3">
              <h2 className="text-xl font-semibold">Admin</h2>
              <p className="text-xs text-muted-foreground">E-Commerce Plattform</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Übersicht" isActive={activeTab === "overview"}>
                  <a onClick={() => navigateTo("overview")}>
                    <LayoutDashboard />
                    <span>Übersicht</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Produkte" isActive={activeTab === "products"}>
                  <a onClick={() => navigateTo("products")}>
                    <Package />
                    <span>Produkte</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Zahlungen" isActive={activeTab === "payments"}>
                  <a onClick={() => navigateTo("payments")}>
                    <CreditCard />
                    <span>Zahlungen</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Kunden" isActive={activeTab === "customers"}>
                  <a onClick={() => navigateTo("customers")}>
                    <Users />
                    <span>Kunden</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Statistiken" isActive={activeTab === "analytics"}>
                  <a onClick={() => navigateTo("analytics")}>
                    <BarChart />
                    <span>Statistiken</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Website-Builder" isActive={activeTab === "website-builder"}>
                  <a onClick={() => navigateTo("website-builder")}>
                    <Globe />
                    <span>Website-Builder</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Einstellungen" isActive={activeTab === "settings"}>
                  <a onClick={() => navigateTo("settings")}>
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

        <SidebarInset className="w-full">
          <div className="w-full">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="mr-2" />
                  <h1 className="text-xl font-bold">
                    {activeTab === "overview" && "Dashboard"}
                    {activeTab === "products" && "Produkte"}
                    {activeTab === "payments" && "Zahlungen"}
                    {activeTab === "customers" && "Kunden"}
                    {activeTab === "analytics" && "Statistiken"}
                    {activeTab === "website-builder" && "Website-Builder"}
                    {activeTab === "settings" && "Einstellungen"}
                  </h1>
                </div>
                <div>
                  {activeTab === "products" && (
                    <Button onClick={() => navigateTo("products")}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Produkt hinzufügen
                    </Button>
                  )}
                  {activeTab === "website-builder" && (
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Neue Website erstellen
                    </Button>
                  )}
                </div>
              </div>
            </header>

            <div className="p-6">
              {activeTab === "overview" && <DashboardOverview />}
              {activeTab === "products" && <ProductsView />}
              {activeTab === "payments" && <PaymentsView />}
              {activeTab === "customers" && <CustomersView />}
              {activeTab === "analytics" && <AnalyticsView />}
              {activeTab === "website-builder" && <WebsiteBuilderView />}
              {activeTab === "settings" && <SettingsView />}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const DashboardOverview = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Gesamtumsatz</CardTitle>
            <CardDescription>Letzten 30 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">€10,249.89</p>
            <p className="text-sm text-green-600">+12.5% zum Vormonat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bestellungen</CardTitle>
            <CardDescription>Letzten 30 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">124</p>
            <p className="text-sm text-green-600">+8.2% zum Vormonat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Neue Kunden</CardTitle>
            <CardDescription>Letzten 30 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45</p>
            <p className="text-sm text-green-600">+15.3% zum Vormonat</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">Neue Bestellung #{1000 + i}</p>
                  <p className="text-sm text-muted-foreground">
                    Kunde: Max Mustermann • Summe: €{(Math.random() * 100).toFixed(2)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  vor {i} {i === 1 ? 'Stunde' : 'Stunden'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductsView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Produktübersicht</CardTitle>
          <CardDescription>Verwalten Sie Ihre Produkte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Produkt</th>
                  <th className="text-left p-3 font-medium">Preis</th>
                  <th className="text-left p-3 font-medium">Lagerbestand</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">Beispielprodukt {i}</div>
                      <div className="text-sm text-muted-foreground">SKU-{1000 + i}</div>
                    </td>
                    <td className="p-3">€{(Math.random() * 100 + 10).toFixed(2)}</td>
                    <td className="p-3">{Math.floor(Math.random() * 100)}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Aktiv
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">Bearbeiten</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentsView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zahlungsübersicht</CardTitle>
          <CardDescription>Übersicht aller Zahlungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Referenz</th>
                  <th className="text-left p-3 font-medium">Kunde</th>
                  <th className="text-left p-3 font-medium">Betrag</th>
                  <th className="text-left p-3 font-medium">Datum</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">PAY-{1000 + i}</div>
                    </td>
                    <td className="p-3">Kunde {i}</td>
                    <td className="p-3">€{(Math.random() * 100 + 10).toFixed(2)}</td>
                    <td className="p-3">{new Date().toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Abgeschlossen
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CustomersView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kundenübersicht</CardTitle>
          <CardDescription>Verwalten Sie Ihre Kunden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Kunde</th>
                  <th className="text-left p-3 font-medium">E-Mail</th>
                  <th className="text-left p-3 font-medium">Bestellungen</th>
                  <th className="text-left p-3 font-medium">Ausgaben</th>
                  <th className="text-left p-3 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">Max Mustermann {i}</div>
                    </td>
                    <td className="p-3">kunde{i}@example.com</td>
                    <td className="p-3">{Math.floor(Math.random() * 10)}</td>
                    <td className="p-3">€{(Math.random() * 1000).toFixed(2)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnalyticsView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistiken</CardTitle>
          <CardDescription>Detaillierte Verkaufsanalysen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[16/9] bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Hier werden Ihre Verkaufsdiagramme angezeigt</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Umsatz nach Produkt</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Produktumsatzdiagramm</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Umsatz nach Zeitraum</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Zeitraumdiagramm</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Kundenherkunft</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Herkunftsdiagramm</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsView = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>Verwalten Sie Ihre Kontoeinstellungen</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account">
            <TabsList className="mb-4">
              <TabsTrigger value="account">Konto</TabsTrigger>
              <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
              <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
              <TabsTrigger value="shop">Shop-Einstellungen</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Profil</h3>
                  <p className="text-sm text-muted-foreground">
                    Aktualisieren Sie Ihre Kontoinformationen.
                  </p>
                </div>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="name">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="p-2 border rounded-md" 
                      placeholder="Max Mustermann" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="email">E-Mail</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="p-2 border rounded-md" 
                      placeholder="max@example.com" 
                    />
                  </div>
                </div>
                <Button>Speichern</Button>
              </div>
            </TabsContent>
            <TabsContent value="appearance" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Erscheinungsbild</h3>
                  <p className="text-sm text-muted-foreground">
                    Passen Sie das Aussehen Ihres Shops an.
                  </p>
                </div>
                <div className="border p-4 rounded-md">
                  <p className="text-muted-foreground">Hier können Sie das Erscheinungsbild anpassen.</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Benachrichtigungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Verwalten Sie Ihre Benachrichtigungseinstellungen.
                  </p>
                </div>
                <div className="border p-4 rounded-md">
                  <p className="text-muted-foreground">Benachrichtigungseinstellungen werden hier angezeigt.</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="shop" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Shop-Einstellungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Konfigurieren Sie Ihren Online-Shop.
                  </p>
                </div>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="shop-name">Shop-Name</label>
                    <input 
                      type="text" 
                      id="shop-name" 
                      className="p-2 border rounded-md" 
                      placeholder="Mein Online-Shop" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="shop-url">URL</label>
                    <input 
                      type="text" 
                      id="shop-url" 
                      className="p-2 border rounded-md" 
                      placeholder="mein-shop.de" 
                    />
                  </div>
                </div>
                <Button>Shop-Einstellungen speichern</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
