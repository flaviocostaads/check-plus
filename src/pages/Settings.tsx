import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { 
  Settings as SettingsIcon, 
  Building, 
  Palette, 
  Upload,
  Plug, 
  Save,
  Camera,
  Trash2,
  Plus,
  ExternalLink,
  ArrowLeft,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import IntegrationDocs from "@/components/IntegrationDocs";

interface CompanySettings {
  id: string;
  company_name: string;
  company_logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  primary_color: string;
  secondary_color: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  config: any;
  is_active: boolean;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: "",
    company_name: "",
    company_logo_url: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    primary_color: "#3b82f6",
    secondary_color: "#64748b"
  });

  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
  }, []);

  const fetchSettings = async () => {
    try {
      // Use the new secure function to get company settings
      const { data, error } = await supabase
        .rpc('get_company_settings');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCompanySettings(data[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      // Don't show error toast for empty results, just log it
      if (error.message?.includes('permission denied')) {
        toast.error("Erro ao carregar configurações");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Erro ao buscar integrações:", error);
    }
  };

  const handleSaveCompanySettings = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .rpc('save_company_settings', {
          p_company_name: companySettings.company_name,
          p_company_logo_url: companySettings.company_logo_url || null,
          p_company_address: companySettings.company_address || null,
          p_company_phone: companySettings.company_phone || null,
          p_company_email: companySettings.company_email || null,
          p_primary_color: companySettings.primary_color,
          p_secondary_color: companySettings.secondary_color
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCompanySettings(data[0]);
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      setCompanySettings(prev => ({ ...prev, company_logo_url: publicUrl }));
      toast.success("Logo carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar logo");
    } finally {
      setUploading(false);
    }
  };

  const toggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("integrations")
        .update({ is_active: isActive })
        .eq("id", integrationId);

      if (error) throw error;
      
      setIntegrations(prev => 
        prev.map(int => 
          int.id === integrationId ? { ...int, is_active: isActive } : int
        )
      );

      toast.success(`Integração ${isActive ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error("Erro ao alterar integração:", error);
      toast.error("Erro ao alterar integração");
    }
  };

  const addIntegration = async (name: string, type: string) => {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .insert([{ name, type, config: {} }])
        .select()
        .single();

      if (error) throw error;
      
      setIntegrations(prev => [data, ...prev]);
      toast.success("Integração adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar integração:", error);
      toast.error("Erro ao adicionar integração");
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta integração?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", integrationId);

      if (error) throw error;
      
      setIntegrations(prev => prev.filter(int => int.id !== integrationId));
      toast.success("Integração excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir integração:", error);
      toast.error("Erro ao excluir integração");
    }
  };

  const handleExportData = async (type: string = 'all') => {
    try {
      setSaving(true);
      console.log("Exportando dados...");
      
      const { data, error } = await supabase.functions.invoke('export-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `nsa-checklist-export-${type}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setSaving(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      console.log("Importando dados...");
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Dados importados: ${data.imported_tables.length} tabelas processadas`);
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} erros encontrados durante a importação`);
        }
      } else {
        toast.error("Falha na importação dos dados");
      }
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao importar dados");
    } finally {
      setSaving(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleAutomaticBackup = async () => {
    try {
      console.log("Configurando backup automático...");
      await handleExportData('all');
      toast.success("Backup automático iniciado!");
    } catch (error) {
      console.error("Erro no backup:", error);
      toast.error("Erro ao realizar backup");
    }
  };

  const handleSystemLogs = async () => {
    try {
      console.log("Abrindo logs do sistema...");
      
      const { data, error } = await supabase.functions.invoke('system-logs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      // Create a simple modal or new tab to display logs
      const logsWindow = window.open('', '_blank', 'width=800,height=600');
      if (logsWindow) {
        logsWindow.document.write(`
          <html>
            <head><title>Logs do Sistema - NSA Checklist</title></head>
            <body style="font-family: monospace; padding: 20px;">
              <h2>Logs do Sistema</h2>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </body>
          </html>
        `);
      }
      
      toast.success("Logs do sistema acessados!");
    } catch (error) {
      console.error("Erro ao acessar logs:", error);
      toast.error("Erro ao acessar logs do sistema");
    }
  };

  const handleClearCache = async () => {
    try {
      setSaving(true);
      console.log("Limpando cache...");
      
      const { data, error } = await supabase.functions.invoke('system-maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clear_cache' })
      });

      if (error) throw error;

      toast.success(data.message);
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache do sistema");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm("Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setSaving(true);
      console.log("Resetando configurações...");
      
      const { data, error } = await supabase.functions.invoke('system-maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reset_configurations' })
      });

      if (error) throw error;

      toast.success(data.message);
      
      // Refresh the page after reset
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Erro ao resetar configurações:", error);
      toast.error("Erro ao resetar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header com botão de retorno */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary to-primary-glow p-2 rounded-xl">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Configurações</h1>
              <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
          <TabsTrigger value="admin">Administrativo</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo da Empresa</Label>
                <div className="space-y-2">
                  {companySettings.company_logo_url && (
                    <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={companySettings.company_logo_url} 
                        alt="Logo da empresa" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label>
                      <Button variant="outline" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <>Carregando...</>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {companySettings.company_logo_url ? "Alterar Logo" : "Adicionar Logo"}
                            </>
                          )}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {companySettings.company_logo_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCompanySettings(prev => ({ ...prev, company_logo_url: "" }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Email da Empresa</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={companySettings.company_email || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, company_email: e.target.value }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_phone">Telefone da Empresa</Label>
                <Input
                  id="company_phone"
                  value={companySettings.company_phone || ""}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, company_phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="company_address">Endereço da Empresa</Label>
                <Textarea
                  id="company_address"
                  value={companySettings.company_address || ""}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, company_address: e.target.value }))}
                  placeholder="Endereço completo da empresa"
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveCompanySettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cores do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={companySettings.primary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={companySettings.primary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={companySettings.secondary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={companySettings.secondary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveCompanySettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Cores"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integrações de Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => addIntegration("WhatsApp Business", "messaging")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    WhatsApp Business
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => addIntegration("Google Drive", "storage")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Google Drive
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => addIntegration("Webhook Custom", "webhook")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Webhook
                  </Button>
                </div>

                <Separator />

                {integrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhuma integração configurada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Plug className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {integration.type}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={integration.is_active}
                            onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                          />
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteIntegration(integration.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <IntegrationDocs />
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup e Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExportData('all')}
                  disabled={saving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={saving}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={saving}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Importar Dados
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleAutomaticBackup}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Backup Automático
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleSystemLogs}
                  disabled={saving}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Logs do Sistema
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleClearCache}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start" 
                  onClick={handleResetSettings}
                  disabled={saving}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Reset Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    );
}

export default Settings;