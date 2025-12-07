import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Trash2, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Address {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  is_primary: boolean;
}

interface AddressManagerProps {
  userId: string;
  onAddressChange?: () => void;
}

const NEIGHBORHOODS = [
  { value: "centro", label: "Centro" },
  { value: "valparaiso", label: "Valparaíso" },
  { value: "quitandinha", label: "Quitandinha" },
  { value: "binguen", label: "Binguen" },
  { value: "mosela", label: "Mosela" },
  { value: "alto-serra", label: "Alto da Serra" },
  { value: "alto-independencia", label: "Alto Independência" },
  { value: "fazenda-inglesa", label: "Fazenda Inglesa" },
  { value: "retiro", label: "Retiro" },
  { value: "correas", label: "Corrêas" },
  { value: "cascatinha", label: "Cascatinha" },
  { value: "samambaia", label: "Samambaia" },
  { value: "quissama", label: "Quissamã" },
  { value: "nogueira", label: "Nogueira" },
  { value: "itaipava", label: "Itaipava" },
  { value: "vale-cuiaba", label: "Vale do Cuiabá" },
  { value: "pedro-rio", label: "Pedro do Rio" },
  { value: "araras", label: "Araras" },
];

const AddressManager = ({ userId, onAddressChange }: AddressManagerProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    address: "",
    neighborhood: "",
    city: "Petrópolis",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    const { data, error } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false });

    if (error) {
      console.error("Error loading addresses:", error);
      return;
    }

    setAddresses(data || []);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("delivery_addresses").insert({
      user_id: userId,
      address: newAddress.address,
      neighborhood: newAddress.neighborhood,
      city: newAddress.city,
      is_primary: addresses.length === 0,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o endereço.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Endereço adicionado!",
      description: "O endereço foi salvo com sucesso.",
    });

    setNewAddress({ address: "", neighborhood: "", city: "Petrópolis" });
    setShowForm(false);
    loadAddresses();
    onAddressChange?.();
  };

  const handleSetPrimary = async (addressId: string) => {
    // Remove primary from all addresses
    await supabase
      .from("delivery_addresses")
      .update({ is_primary: false })
      .eq("user_id", userId);

    // Set new primary
    const { error } = await supabase
      .from("delivery_addresses")
      .update({ is_primary: true })
      .eq("id", addressId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o endereço principal.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Endereço principal atualizado!",
    });

    loadAddresses();
    onAddressChange?.();
  };

  const handleDeleteAddress = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("delivery_addresses")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o endereço.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Endereço excluído!",
    });

    setDeleteId(null);
    loadAddresses();
    onAddressChange?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Meus Endereços</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Endereço
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <Label htmlFor="new-address">Endereço Completo *</Label>
                <Input
                  id="new-address"
                  value={newAddress.address}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address: e.target.value })
                  }
                  placeholder="Rua, número, complemento"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-neighborhood">Bairro *</Label>
                  <Select
                    value={newAddress.neighborhood}
                    onValueChange={(value) =>
                      setNewAddress({ ...newAddress, neighborhood: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEIGHBORHOODS.map((n) => (
                        <SelectItem key={n.value} value={n.value}>
                          {n.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-city">Cidade *</Label>
                  <Input
                    id="new-city"
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar Endereço
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{addr.address}</p>
                      {addr.is_primary && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {NEIGHBORHOODS.find((n) => n.value === addr.neighborhood)
                        ?.label || addr.neighborhood}
                      , {addr.city}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!addr.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(addr.id)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  {addresses.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(addr.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endereço será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressManager;
