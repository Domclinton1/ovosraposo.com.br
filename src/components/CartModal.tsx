import { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./ProductsSection";

interface CartItem extends Product {
  cartQuantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: (formData?: QuickCheckoutData) => void;
}

export interface QuickCheckoutData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
}

const CartModal = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout 
}: CartModalProps) => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showQuickCheckout, setShowQuickCheckout] = useState(false);
  const [quickCheckoutData, setQuickCheckoutData] = useState<QuickCheckoutData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    neighborhood: "",
    city: "Petrópolis"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [isOpen]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  if (!isOpen) return null;

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);

  const handleQuantityChange = (productId: number, change: number) => {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
      const newQuantity = item.cartQuantity + change;
      if (newQuantity <= 0) {
        onRemoveItem(productId);
        toast({
          title: "Produto removido",
          description: "Item foi removido do carrinho",
        });
      } else {
        onUpdateQuantity(productId, newQuantity);
      }
    }
  };

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }
    
    if (isAuthenticated) {
      onCheckout();
    } else {
      setShowQuickCheckout(true);
    }
  };

  const handleQuickCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!quickCheckoutData.email.includes('@')) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (quickCheckoutData.password.length < 8) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter no mínimo 8 caracteres",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (quickCheckoutData.password !== quickCheckoutData.confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "As senhas digitadas não são iguais. Por favor, verifique e tente novamente",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validação de cidade
      const cityLower = quickCheckoutData.city.toLowerCase().trim();
      if (cityLower !== "petrópolis" && cityLower !== "petropolis") {
        toast({
          title: "Cidade não atendida",
          description: `Desculpe, no momento entregamos apenas em Petrópolis. A cidade "${quickCheckoutData.city}" ainda não está em nossa área de cobertura. Em breve estaremos expandindo!`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Tentar criar conta primeiro
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: quickCheckoutData.email,
        password: quickCheckoutData.password,
        options: {
          data: {
            full_name: quickCheckoutData.name,
            phone: quickCheckoutData.phone,
            address: quickCheckoutData.address,
            neighborhood: quickCheckoutData.neighborhood,
            city: quickCheckoutData.city
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      // Se o usuário já existe, tentar fazer login
      if (signUpError && signUpError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: quickCheckoutData.email,
          password: quickCheckoutData.password,
        });

        if (signInError) {
          toast({
            title: "Erro ao fazer login",
            description: "Email já cadastrado. Verifique sua senha e tente novamente.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // Verificar se o perfil existe, se não, criar
        if (signInData.user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', signInData.user.id)
            .maybeSingle();

          if (!existingProfile) {
            // Criar perfil se não existir
            await supabase
              .from('profiles')
              .insert({
                user_id: signInData.user.id,
                full_name: quickCheckoutData.name,
                phone: quickCheckoutData.phone,
                email: signInData.user.email || quickCheckoutData.phone,
              });
          }
        }

        toast({
          title: "Login realizado!",
          description: "Finalizando seu pedido...",
        });

        // Aguardar um momento para garantir que a sessão está ativa
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (signUpError) {
        toast({
          title: "Erro ao criar conta",
          description: signUpError.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      } else {
        toast({
          title: "Conta criada!",
          description: "Finalizando seu pedido...",
        });

        // Se a conta foi criada, aguardar a sessão estar disponível
        if (signUpData?.session) {
          // Sessão já disponível, criar perfil se necessário
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', signUpData.user.id)
            .maybeSingle();

          if (!existingProfile) {
            await supabase
              .from('profiles')
              .insert({
                user_id: signUpData.user.id,
                full_name: quickCheckoutData.name,
                phone: quickCheckoutData.phone,
                email: signUpData.user.email || quickCheckoutData.phone,
              });
          }
        }

        // Aguardar um momento para garantir que a sessão está ativa
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Finalizar pedido com os dados
      onCheckout(quickCheckoutData);
      setShowQuickCheckout(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCheckoutChange = (field: keyof QuickCheckoutData, value: string) => {
    setQuickCheckoutData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <Card className="w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden bg-card rounded-t-2xl sm:rounded-xl flex flex-col sm:m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 shrink-0">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {showQuickCheckout ? "Finalizar Pedido" : `Seu Carrinho (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})`}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowQuickCheckout(false);
              onClose();
            }}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1 px-4 sm:px-6">
          {showQuickCheckout ? (
            <form onSubmit={handleQuickCheckoutSubmit} className="space-y-3 sm:space-y-4">
              <div className="bg-muted/30 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-semibold mb-2">Resumo do Pedido:</p>
                {cartItems.map((item) => (
                  <p key={item.id} className="text-xs sm:text-sm text-muted-foreground">
                    {item.cartQuantity}x {item.name} - R$ {(item.price * item.cartQuantity).toFixed(2).replace('.', ',')}
                  </p>
                ))}
                <p className="text-base sm:text-lg font-bold text-primary mt-2">
                  Total: R$ {totalPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <Label htmlFor="quick-name">Nome Completo *</Label>
                  <Input
                    id="quick-name"
                    type="text"
                    value={quickCheckoutData.name}
                    onChange={(e) => handleQuickCheckoutChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quick-email">Email *</Label>
                  <Input
                    id="quick-email"
                    type="email"
                    value={quickCheckoutData.email}
                    onChange={(e) => handleQuickCheckoutChange('email', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quick-password">Senha (mínimo 8 caracteres) *</Label>
                  <Input
                    id="quick-password"
                    type="password"
                    value={quickCheckoutData.password}
                    onChange={(e) => handleQuickCheckoutChange('password', e.target.value)}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div>
                  <Label htmlFor="quick-confirm-password">Confirmar Senha *</Label>
                  <Input
                    id="quick-confirm-password"
                    type="password"
                    value={quickCheckoutData.confirmPassword}
                    onChange={(e) => handleQuickCheckoutChange('confirmPassword', e.target.value)}
                    required
                    minLength={8}
                    placeholder="Digite a senha novamente"
                  />
                </div>

                <div>
                  <Label htmlFor="quick-phone">Telefone *</Label>
                  <Input
                    id="quick-phone"
                    type="tel"
                    value={quickCheckoutData.phone}
                    onChange={(e) => handleQuickCheckoutChange('phone', e.target.value)}
                    placeholder="(24) 99999-9999"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quick-address">Endereço Completo *</Label>
                  <Input
                    id="quick-address"
                    type="text"
                    value={quickCheckoutData.address}
                    onChange={(e) => handleQuickCheckoutChange('address', e.target.value)}
                    placeholder="Rua, número, complemento"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quick-neighborhood">Bairro *</Label>
                  <Input
                    id="quick-neighborhood"
                    type="text"
                    value={quickCheckoutData.neighborhood}
                    onChange={(e) => handleQuickCheckoutChange('neighborhood', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quick-city">Cidade *</Label>
                  <Input
                    id="quick-city"
                    type="text"
                    value={quickCheckoutData.city}
                    onChange={(e) => handleQuickCheckoutChange('city', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickCheckout(false)}
                  className="w-full sm:flex-1"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:flex-1 cta-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processando..." : "Criar Conta e Finalizar"}
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/`,
                        queryParams: {
                          access_type: 'offline',
                          prompt: 'consent',
                        }
                      }
                    });

                    if (error) {
                      toast({
                        title: "Erro ao fazer login",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Erro inesperado",
                      description: "Ocorreu um erro ao fazer login com Google.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar com Google
              </Button>
            </form>
          ) : (
            <>
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-2">
                    Seu carrinho está vazio
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione alguns produtos para continuar
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-lg mx-auto sm:mx-0"
                      />
                      
                      <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {item.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.quantity} unidades por pente
                        </p>
                        <p className="text-base sm:text-lg font-bold text-primary mt-1">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-base sm:text-lg font-semibold min-w-[2rem] text-center">
                          {item.cartQuantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-center sm:text-right w-full sm:w-auto">
                        <p className="text-base sm:text-lg font-bold text-foreground">
                          R$ {(item.price * item.cartQuantity).toFixed(2).replace('.', ',')}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive/80 h-auto p-0 text-xs sm:text-sm mt-1"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>

        {cartItems.length > 0 && !showQuickCheckout && (
          <div className="border-t border-border p-4 sm:p-6 shrink-0 bg-card">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base sm:text-lg font-semibold text-foreground">
                Total do Pedido:
              </span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground mb-3 space-y-1">
              <p>✓ Frete grátis para Petrópolis</p>
              <p>✓ Entrega no mesmo dia (pedidos até 16h30)</p>
              <p>✓ Ovos frescos da granja</p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                onClick={handleCheckoutClick}
                className="w-full cta-button text-base sm:text-lg py-3 sm:py-3"
              >
                {isAuthenticated ? "Finalizar Pedido" : "Finalizar Pedido (Cadastro Rápido)"}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Continuar Comprando
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CartModal;