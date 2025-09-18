import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Car, Bike, Camera, Image, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VehicleType } from "@/types/inspection";
import { Link } from "react-router-dom";

interface Vehicle {
  id: string;
  marca_modelo: string;
  placa: string;
  cor: string;
  ano: string;
  renavam: string;
  km_atual?: string;
  vehicle_type: VehicleType;
  photo_url?: string;
  avatar_url?: string;
  cidade?: string;
  estado?: string;
  created_at: string;
}

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    marca_modelo: "",
    placa: "",
    cor: "",
    ano: "",
    renavam: "",
    km_atual: "",
    vehicle_type: "" as VehicleType,
    photo_url: "",
    avatar_url: "",
    cidade: "",
    estado: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
      toast.error("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marca_modelo || !formData.placa || !formData.cor || !formData.ano || !formData.renavam || !formData.vehicle_type) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(formData)
          .eq("id", editingVehicle.id);

        if (error) throw error;
        toast.success("Veículo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert([formData]);

        if (error) throw error;
        toast.success("Veículo cadastrado com sucesso!");
      }

      setDialogOpen(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error: any) {
      console.error("Erro ao salvar veículo:", error);
      if (error.code === '23505') {
        toast.error("Esta placa já está cadastrada");
      } else {
        toast.error("Erro ao salvar veículo");
      }
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      marca_modelo: vehicle.marca_modelo,
      placa: vehicle.placa,
      cor: vehicle.cor,
      ano: vehicle.ano,
      renavam: vehicle.renavam,
      km_atual: vehicle.km_atual || "",
      vehicle_type: vehicle.vehicle_type,
      photo_url: vehicle.photo_url || "",
      avatar_url: vehicle.avatar_url || "",
      cidade: vehicle.cidade || "",
      estado: vehicle.estado || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Veículo excluído com sucesso!");
      fetchVehicles();
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast.error("Erro ao excluir veículo");
    }
  };

  const resetForm = () => {
    setFormData({
      marca_modelo: "",
      placa: "",
      cor: "",
      ano: "",
      renavam: "",
      km_atual: "",
      vehicle_type: "" as VehicleType,
      photo_url: "",
      avatar_url: "",
      cidade: "",
      estado: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingVehicle(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Veículos</h1>
              <p className="text-muted-foreground">Gerencie a frota de veículos</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? "Editar Veículo" : "Cadastrar Novo Veículo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vehicle_type">Tipo de Veículo *</Label>
                  <Select 
                    value={formData.vehicle_type} 
                    onValueChange={(value: VehicleType) => setFormData({...formData, vehicle_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="marca_modelo">Marca/Modelo *</Label>
                  <Input
                    id="marca_modelo"
                    value={formData.marca_modelo}
                    onChange={(e) => setFormData({...formData, marca_modelo: e.target.value})}
                    placeholder="Ex: Honda Civic"
                  />
                </div>

                <div>
                  <Label htmlFor="placa">Placa *</Label>
                  <Input
                    id="placa"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                    placeholder="Ex: ABC1234"
                  />
                </div>

                <div>
                  <Label htmlFor="cor">Cor *</Label>
                  <Input
                    id="cor"
                    value={formData.cor}
                    onChange={(e) => setFormData({...formData, cor: e.target.value})}
                    placeholder="Ex: Branco"
                  />
                </div>

                <div>
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    value={formData.ano}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setFormData({...formData, ano: value});
                      }
                    }}
                    placeholder="Ex: 2020"
                    maxLength={4}
                  />
                </div>

                <div>
                  <Label htmlFor="renavam">RENAVAM *</Label>
                  <Input
                    id="renavam"
                    value={formData.renavam}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        setFormData({...formData, renavam: value});
                      }
                    }}
                    placeholder="Ex: 12345678901"
                    maxLength={11}
                  />
                </div>

                <div>
                  <Label htmlFor="km_atual">KM Atual</Label>
                  <Input
                    id="km_atual"
                    value={formData.km_atual}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, km_atual: value});
                    }}
                    placeholder="Ex: 50000"
                  />
                </div>

                <div>
                  <Label>Avatar do Veículo</Label>
                  <div className="space-y-2">
                    {formData.avatar_url && (
                      <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={formData.avatar_url} 
                          alt="Avatar do veículo" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label>
                        <Button type="button" variant="outline" disabled={uploading} asChild>
                          <span>
                            {uploading ? (
                              <>Carregando...</>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-2" />
                                {formData.avatar_url ? "Alterar Avatar" : "Adicionar Avatar"}
                              </>
                            )}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {formData.avatar_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData(prev => ({ ...prev, avatar_url: "" }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      placeholder="Ex: São Paulo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      placeholder="Ex: SP"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingVehicle ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Veículos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum veículo cadastrado
              </div>
            ) : (
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                          {vehicle.avatar_url ? (
                            <img 
                              src={vehicle.avatar_url} 
                              alt={`Avatar ${vehicle.marca_modelo}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.vehicle_type === 'car' ? 'default' : 'secondary'}>
                          {vehicle.vehicle_type === 'car' ? (
                            <><Car className="h-3 w-3 mr-1" /> Carro</>
                          ) : (
                            <><Bike className="h-3 w-3 mr-1" /> Moto</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.marca_modelo}</TableCell>
                      <TableCell>{vehicle.placa}</TableCell>
                      <TableCell>{vehicle.cor}</TableCell>
                      <TableCell>{vehicle.ano}</TableCell>
                      <TableCell>{vehicle.km_atual || "-"}</TableCell>
                      <TableCell>
                        {vehicle.cidade && vehicle.estado 
                          ? `${vehicle.cidade}/${vehicle.estado}` 
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleManagement;