import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDriverCreated: (driver: any) => void;
}

interface DriverFormData {
  nome_completo: string;
  cpf: string;
  cnh_numero: string;
  cnh_validade: string;
  telefone: string;
  email: string;
  endereco: string;
}

export default function DriverFormDialog({ 
  open, 
  onOpenChange, 
  onDriverCreated 
}: DriverFormDialogProps) {
  const [formData, setFormData] = useState<DriverFormData>({
    nome_completo: "",
    cpf: "",
    cnh_numero: "",
    cnh_validade: "",
    telefone: "",
    email: "",
    endereco: ""
  });
  const [loading, setLoading] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value.slice(0, 14);
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    return value.slice(0, 10);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    return value.slice(0, 15);
  };

  const validateForm = () => {
    if (!formData.nome_completo.trim()) {
      toast.error("Nome completo é obrigatório");
      return false;
    }
    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório");
      return false;
    }
    if (!formData.cnh_numero.trim()) {
      toast.error("Número da CNH é obrigatório");
      return false;
    }
    if (!formData.cnh_validade.trim()) {
      toast.error("Validade da CNH é obrigatória");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Check if user has permission
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert([formData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // Handle specific error types
        if (error.code === 'PGRST301') {
          toast.error("Acesso negado: você não tem permissão para cadastrar motoristas");
        } else if (error.message.includes('CPF inválido')) {
          toast.error("CPF inválido. Verifique o formato e tente novamente.");
        } else if (error.message.includes('CNH inválida')) {
          toast.error("CNH inválida. Verifique o número e tente novamente.");
        } else if (error.message.includes('Email inválido')) {
          toast.error("Email inválido. Verifique o formato e tente novamente.");
        } else if (error.code === '23505') {
          toast.error("Já existe um motorista com este CPF ou CNH");
        } else {
          toast.error(`Erro ao cadastrar motorista: ${error.message}`);
        }
        return;
      }

      toast.success("Motorista cadastrado com sucesso!");
      onDriverCreated(data);
      resetForm();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error("Erro inesperado ao cadastrar motorista");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      cpf: "",
      cnh_numero: "",
      cnh_validade: "",
      telefone: "",
      email: "",
      endereco: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                placeholder="Nome completo do motorista"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setFormData(prev => ({ ...prev, cpf: formatted }));
                }}
                placeholder="000.000.000-00"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnh_numero">CNH Número *</Label>
              <Input
                id="cnh_numero"
                value={formData.cnh_numero}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData(prev => ({ ...prev, cnh_numero: numbers }));
                }}
                placeholder="12345678901"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnh_validade">Validade CNH *</Label>
              <Input
                id="cnh_validade"
                value={formData.cnh_validade}
                onChange={(e) => {
                  const formatted = formatDate(e.target.value);
                  setFormData(prev => ({ ...prev, cnh_validade: formatted }));
                }}
                placeholder="DD/MM/AAAA"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setFormData(prev => ({ ...prev, telefone: formatted }));
                }}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Endereço completo"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}