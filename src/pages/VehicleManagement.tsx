import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Car, Bike, Camera, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VehicleType } from "@/types/inspection";

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar foto");
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
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingVehicle(null);
    resetForm();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Gerenciamento de Veículos</h1>
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
                  onChange={(e) => setFormData({...formData, ano: e.target.value})}
                  placeholder="Ex: 2020"
                />
              </div>

              <div>
                <Label htmlFor="renavam">RENAVAM *</Label>
                <Input
                  id="renavam"
                  value={formData.renavam}
                  onChange={(e) => setFormData({...formData, renavam: e.target.value})}
                  placeholder="Ex: 12345678901"
                />
              </div>

              <div>
                <Label htmlFor="km_atual">KM Atual</Label>
                <Input
                  id="km_atual"
                  value={formData.km_atual}
                  onChange={(e) => setFormData({...formData, km_atual: e.target.value})}
                  placeholder="Ex: 50000"
                />
              </div>

              <div>
                <Label>Foto do Veículo</Label>
                <div className="space-y-2">
                  {formData.photo_url && (
                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={formData.photo_url} 
                        alt="Foto do veículo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Button type="button" variant="outline" className="w-full" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <>Carregando...</>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              {formData.photo_url ? "Alterar Foto" : "Adicionar Foto"}
                            </>
                          )}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {formData.photo_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData(prev => ({ ...prev, photo_url: "" }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                  <TableHead>Foto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {vehicle.photo_url ? (
                          <img 
                            src={vehicle.photo_url} 
                            alt={`Foto ${vehicle.marca_modelo}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="h-6 w-6 text-muted-foreground" />
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
  );
};

export default VehicleManagement;