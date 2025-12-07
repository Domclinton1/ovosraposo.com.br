import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const completeProfileSchema = z.object({
  phone: z.string().trim().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone muito longo"),
  address: z.string().trim().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200, "Endereço muito longo"),
  neighborhood: z.string().trim().min(1, "Bairro é obrigatório"),
  city: z.string().trim().min(1, "Cidade é obrigatória").max(100, "Cidade muito longa")
    .refine((city) => city.toLowerCase() === "petrópolis" || city.toLowerCase() === "petropolis", {
      message: "No momento, entregamos apenas em Petrópolis"
    }),
});

const CompleteProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    phone: "",
    address: "",
    neighborhood: "",
    city: "Petrópolis",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verificar se já tem endereço cadastrado
      const { data: addressData } = await supabase
        .from("delivery_addresses")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (addressData) {
        // Já tem endereço, redirecionar para home
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = completeProfileSchema.parse(profileData);

      // Verificação adicional de cidade
      if (validatedData.city.toLowerCase() !== "petrópolis" && validatedData.city.toLowerCase() !== "petropolis") {
        toast({
          title: "Cidade não atendida",
          description: `Desculpe, no momento entregamos apenas em Petrópolis. A cidade "${validatedData.city}" ainda não está em nossa área de cobertura.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Atualizar perfil com telefone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone: validatedData.phone })
        .eq('user_id', session.user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        toast({
          title: "Erro ao atualizar perfil",
          description: profileError.message,
          variant: "destructive",
        });
        return;
      }

      // Criar endereço de entrega
      const { error: addressError } = await supabase
        .from('delivery_addresses')
        .insert({
          user_id: session.user.id,
          address: validatedData.address,
          neighborhood: validatedData.neighborhood,
          city: validatedData.city,
          is_primary: true,
        });

      if (addressError) {
        console.error('Erro ao criar endereço:', addressError);
        toast({
          title: "Erro ao salvar endereço",
          description: addressError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro completo!",
        description: "Seu perfil foi atualizado com sucesso.",
      });

      navigate("/");
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao completar seu cadastro. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Complete seu Cadastro
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Para continuar, precisamos de algumas informações para entrega
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefone/WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(24) 99999-9999"
                    required
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    type="text"
                    value={profileData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Rua, número, complemento"
                    required
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Select value={profileData.neighborhood} onValueChange={(value) => handleChange("neighborhood", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Centro</SelectItem>
                        <SelectItem value="mosela">Mosela</SelectItem>
                        <SelectItem value="valparaiso">Valparaíso</SelectItem>
                        <SelectItem value="alto-serra">Alto da Serra</SelectItem>
                        <SelectItem value="quitandinha">Quitandinha</SelectItem>
                        <SelectItem value="alto-independencia">Alto da Independência</SelectItem>
                        <SelectItem value="bingen">Bingen</SelectItem>
                        <SelectItem value="fazenda-inglesa">Fazenda Inglesa</SelectItem>
                        <SelectItem value="retiro">Retiro</SelectItem>
                        <SelectItem value="samambaia">Samambaia</SelectItem>
                        <SelectItem value="correas">Corrêas</SelectItem>
                        <SelectItem value="quissama">Quissamã</SelectItem>
                        <SelectItem value="cascatinha">Cascatinha</SelectItem>
                        <SelectItem value="nogueira">Nogueira</SelectItem>
                        <SelectItem value="itaipava">Itaipava</SelectItem>
                        <SelectItem value="vale-cuiaba">Vale do Cuiabá</SelectItem>
                        <SelectItem value="pedro-rio">Pedro do Rio</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.neighborhood && (
                      <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      type="text"
                      value={profileData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Petrópolis"
                      required
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Completar Cadastro"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CompleteProfile;
