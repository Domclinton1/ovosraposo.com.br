import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { CardPaymentForm } from "./CardPaymentForm";
import type { Product } from "./ProductsSection";

const checkoutSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  phone: z.string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length >= 10 && val.length <= 11, {
      message: "Telefone deve ter 10 ou 11 dígitos"
    }),
  address: z.string()
    .trim()
    .min(5, "Endereço deve ter pelo menos 5 caracteres")
    .max(200, "Endereço muito longo"),
  city: z.string()
    .trim()
    .min(2, "Cidade é obrigatória")
    .max(100, "Nome da cidade muito longo"),
  neighborhood: z.string()
    .trim()
    .min(2, "Bairro deve ter pelo menos 2 caracteres")
    .max(100, "Nome do bairro muito longo"),
      paymentMethod: z.string()
    .min(1, "Selecione uma forma de pagamento")
    .refine((val) => ["pix", "debit_card", "credit_card", "dinheiro"].includes(val), {
      message: "Forma de pagamento inválida"
    }),
  cardToken: z.string().optional(),
  paymentMethodId: z.string().optional(),
  issuerId: z.string().optional(),
});

interface CartItem extends Product {
  cartQuantity: number;
}

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSubmit: (formData: CheckoutFormData) => void;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  neighborhood: string;
  paymentMethod: string;
  cardToken?: string;
  paymentMethodId?: string;
  issuerId?: string;
  identificationType?: string;
  identificationNumber?: string;
}

const CheckoutForm = ({ isOpen, onClose, cartItems, onSubmit }: CheckoutFormProps) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardToken, setCardToken] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [issuerId, setIssuerId] = useState<string>("");
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    phone: "",
    address: "",
    city: "",
    neighborhood: "",
    paymentMethod: "",
  });

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFormData({
        name: profileData.full_name,
        phone: profileData.phone,
        address: "",
        city: "",
        neighborhood: "",
        paymentMethod: "",
      });
    }

    // Load saved addresses
    const { data: addressesData } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("is_primary", { ascending: false });

    if (addressesData && addressesData.length > 0) {
      setAddresses(addressesData);
      const primaryAddress = addressesData.find(a => a.is_primary) || addressesData[0];
      setSelectedAddressId(primaryAddress.id);
      setFormData(prev => ({
        ...prev,
        address: primaryAddress.address,
        neighborhood: primaryAddress.neighborhood,
        city: primaryAddress.city,
      }));
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mapear bairro para dia de entrega
  const getDeliveryDay = (neighborhood: string): string | null => {
    const deliverySchedule = [
      {
        day: "Quarta-feira",
        neighborhoods: ["centro", "valparaiso", "quitandinha", "binguen", "mosela", "alto-serra", "alto-independencia", "fazenda-inglesa"]
      },
      {
        day: "Quinta-feira",
        neighborhoods: ["retiro", "correas", "cascatinha", "samambaia", "quissama"]
      },
      {
        day: "Sexta-feira",
        neighborhoods: ["nogueira", "itaipava", "vale-cuiaba", "pedro-rio", "araras"]
      }
    ];

    const normalizedNeighborhood = neighborhood.toLowerCase();
    const schedule = deliverySchedule.find(s => 
      s.neighborhoods.includes(normalizedNeighborhood)
    );

    return schedule ? schedule.day : null;
  };

  const deliveryDay = formData.neighborhood ? getDeliveryDay(formData.neighborhood) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isProcessing) return;
    
    // Validate form data using Zod schema
    try {
      const validatedData = checkoutSchema.parse(formData);
      
      // Validação de cidade - SEMPRE validar, não apenas para novos endereços
      const cityLower = validatedData.city.toLowerCase();
      if (cityLower !== "petrópolis" && cityLower !== "petropolis") {
        toast({
          title: "Cidade não atendida",
          description: `Desculpe, no momento entregamos apenas em Petrópolis.`,
          variant: "destructive",
        });
        return;
      }

      // Se for pagamento com cartão, gerar token primeiro
      if (validatedData.paymentMethod === "debit_card" || validatedData.paymentMethod === "credit_card") {
        setIsProcessing(true);
        
        // Chamar função de tokenização do CardPaymentForm
        const generateToken = (window as any).generateCardToken;
        if (!generateToken) {
          toast({
            title: "Erro",
            description: "Sistema de pagamento não carregado. Recarregue a página.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const tokenData = await generateToken();
        
        setIsProcessing(false);
        
        if (!tokenData) {
          // Erro já foi tratado no CardPaymentForm
          return;
        }

        // Usar dados retornados diretamente da tokenização
        const dataWithToken: CheckoutFormData = {
          name: validatedData.name,
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          neighborhood: validatedData.neighborhood,
          paymentMethod: validatedData.paymentMethod,
          cardToken: tokenData.token,
          paymentMethodId: tokenData.paymentMethodId,
          issuerId: tokenData.issuerId,
          identificationType: tokenData.identificationType,
          identificationNumber: tokenData.identificationNumber,
        };

        console.log('=== CHECKOUT FORM - Sending data ===');
        console.log('Card Token:', tokenData.token ? '***EXISTS***' : 'MISSING');
        console.log('Payment Method ID:', tokenData.paymentMethodId || 'MISSING');
        console.log('Issuer ID:', tokenData.issuerId || 'MISSING');

        // Save new address if provided
        if (showNewAddress && profile) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from("delivery_addresses").insert({
              user_id: session.user.id,
              address: formData.address,
              neighborhood: formData.neighborhood,
              city: formData.city,
              is_primary: false,
            });
          }
        }

        onSubmit(dataWithToken);
        return;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast({
          title: "Dados inválidos",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao validar formulário",
        variant: "destructive",
      });
      return;
    }

    // Save new address if provided
    if (showNewAddress && profile) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("delivery_addresses").insert({
          user_id: session.user.id,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          is_primary: false,
        });
      }
    }

    onSubmit({
      ...formData,
      cardToken,
      paymentMethodId,
      issuerId,
    });
  };

  const handleCardTokenGenerated = (
    token: string, 
    methodId: string, 
    issuer: string,
    idType: string,
    idNumber: string
  ) => {
    console.log("Token recebido:", token);
    setCardToken(token);
    setPaymentMethodId(methodId);
    setIssuerId(issuer);
    setFormData(prev => ({
      ...prev,
      identificationType: idType,
      identificationNumber: idNumber,
    }));
  };

  const handleCardError = (error: string) => {
    toast({
      title: "Erro no cartão",
      description: error,
      variant: "destructive",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <Card className="w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden bg-card rounded-t-2xl sm:rounded-xl flex flex-col sm:m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 shrink-0">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            Finalizar Pedido
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="space-y-4 sm:space-y-6 pb-4 flex-1 overflow-y-auto">
              {/* Resumo do Pedido */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-sm sm:text-base">Resumo do Pedido</h3>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {item.cartQuantity}x {item.name}
                  </span>
                  <span className="text-sm font-semibold">
                    R$ {(item.price * item.cartQuantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base">Endereço de Entrega</h3>
              
              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-2 sm:space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-muted/30 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setFormData({
                          ...formData,
                          address: addr.address,
                          neighborhood: addr.neighborhood,
                          city: addr.city,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{addr.address}</p>
                            {addr.is_primary && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {addr.neighborhood}, {addr.city}
                          </p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="text-primary">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!showNewAddress && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewAddress(true);
                    setSelectedAddressId("");
                    setFormData({
                      ...formData,
                      address: "",
                      neighborhood: "",
                      city: "",
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Usar outro endereço
                </Button>
              )}
              
              {showNewAddress && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Rua, número, complemento"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Select value={formData.neighborhood} onValueChange={(value) => handleInputChange("neighborhood", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="centro">Centro</SelectItem>
                          <SelectItem value="valparaiso">Valparaíso</SelectItem>
                          <SelectItem value="quitandinha">Quitandinha</SelectItem>
                          <SelectItem value="binguen">Binguen</SelectItem>
                          <SelectItem value="mosela">Mosela</SelectItem>
                          <SelectItem value="alto-serra">Alto da Serra</SelectItem>
                          <SelectItem value="alto-independencia">Alto Independência</SelectItem>
                          <SelectItem value="fazenda-inglesa">Fazenda Inglesa</SelectItem>
                          <SelectItem value="retiro">Retiro</SelectItem>
                          <SelectItem value="correas">Corrêas</SelectItem>
                          <SelectItem value="cascatinha">Cascatinha</SelectItem>
                          <SelectItem value="samambaia">Samambaia</SelectItem>
                          <SelectItem value="quissama">Quissamã</SelectItem>
                          <SelectItem value="nogueira">Nogueira</SelectItem>
                          <SelectItem value="itaipava">Itaipava</SelectItem>
                          <SelectItem value="vale-cuiaba">Vale do Cuiabá</SelectItem>
                          <SelectItem value="pedro-rio">Pedro do Rio</SelectItem>
                          <SelectItem value="araras">Araras</SelectItem>
                        </SelectContent>
                      </Select>
                      {deliveryDay && (
                        <p className="text-sm text-primary mt-2 flex items-center gap-2">
                          <span className="text-lg">🎉</span>
                          <span>Excelente escolha! Seu pedido irá para sua casa na <strong>{deliveryDay}</strong></span>
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="Petrópolis"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base">Forma de Pagamento *</h3>
              <p className="text-sm text-muted-foreground">
                Selecione como deseja pagar seu pedido
              </p>
              
              <Select 
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">💰 PIX</SelectItem>
                  <SelectItem value="debit_card">💳 Cartão de Débito</SelectItem>
                  <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
                  <SelectItem value="dinheiro">💵 Pagar na Entrega</SelectItem>
                </SelectContent>
              </Select>

              {/* Formulário de Cartão */}
              {(formData.paymentMethod === "debit_card" || formData.paymentMethod === "credit_card") && (
                <CardPaymentForm
                  paymentMethod={formData.paymentMethod}
                  onTokenGenerated={handleCardTokenGenerated}
                  onError={handleCardError}
                />
              )}
            </div>

              {/* Informações de Entrega */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <p>✓ Frete grátis para Petrópolis</p>
                  <p>✓ Entregas de Quarta a Sexta-feira (08:00 às 16:00)</p>
                  <p>✓ Pedidos após 16h vão para o próximo dia de rota</p>
                  <p>✓ Ovos frescos da granja</p>
                </div>
              </div>
            </div>

            {/* Botões fixos no rodapé */}
            <div className="border-t border-border pt-4 mt-4 shrink-0 space-y-2 sm:space-y-3 pb-4">
              <Button 
                type="submit"
                className="w-full cta-button text-base sm:text-lg py-3"
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Confirmar Pedido"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="w-full"
              >
                Voltar ao Carrinho
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutForm;