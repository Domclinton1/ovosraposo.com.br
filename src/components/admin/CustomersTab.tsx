import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  addresses: Array<{
    neighborhood: string;
    city: string;
    address: string;
  }>;
}

const CustomersTab = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomersByNeighborhood();
  }, [customers, selectedNeighborhood]);

  const loadCustomers = async () => {
    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error loading profiles:", profilesError);
      return;
    }

    // Buscar todos os endereços
    const { data: addresses, error: addressesError } = await supabase
      .from("delivery_addresses")
      .select("*");

    if (addressesError) {
      console.error("Error loading addresses:", addressesError);
      return;
    }

    // Combinar dados
    const customersData: Customer[] = (profiles || []).map(profile => ({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      addresses: (addresses || [])
        .filter(addr => addr.user_id === profile.user_id)
        .map(addr => ({
          neighborhood: addr.neighborhood,
          city: addr.city,
          address: addr.address
        }))
    }));

    setCustomers(customersData);

    // Extrair bairros únicos
    const uniqueNeighborhoods = Array.from(
      new Set(
        (addresses || []).map(addr => addr.neighborhood)
      )
    ).sort();
    
    setNeighborhoods(uniqueNeighborhoods);
  };

  const filterCustomersByNeighborhood = () => {
    if (selectedNeighborhood === "all") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.addresses.some(addr => addr.neighborhood === selectedNeighborhood)
      );
      setFilteredCustomers(filtered);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtro de Bairro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por Bairro</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {neighborhoods.map(neighborhood => (
                <SelectItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estatística */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{filteredCustomers.length}</div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map(customer => (
            <Card key={customer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customer.addresses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereços:
                    </p>
                    {customer.addresses.map((addr, idx) => (
                      <div key={idx} className="pl-6 text-sm text-muted-foreground">
                        <p>{addr.address}</p>
                        <p>{addr.neighborhood} - {addr.city}</p>
                      </div>
                    ))}
                  </div>
                )}
                {customer.addresses.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomersTab;
