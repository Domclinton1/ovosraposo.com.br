import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressManager from "@/components/AddressManager";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
      });

      // Verificar se usuário precisa completar cadastro
      const { data: addressData } = await supabase
        .from("delivery_addresses")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      // Se não tem telefone OU não tem endereço, redireciona
      if (!data.phone || !addressData) {
        toast({
          title: "Cadastro incompleto",
          description: "Complete seu cadastro para fazer pedidos.",
        });
        navigate("/complete-profile");
      }
    }
  };

  const handleInputChange = (field: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    const { uploadAvatar } = await import("@/lib/avatarUpload");
    const result = await uploadAvatar(file, userId);

    if (result.success && result.url) {
      setProfile(prev => ({ ...prev, avatar_url: result.url! }));
      toast({
        title: "Avatar atualizado!",
        description: "Sua foto foi atualizada com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível atualizar o avatar",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Meu Perfil</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      <User className="w-16 h-16" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-primary hover:text-primary/80">
                      <Upload className="w-4 h-4" />
                      <span>Alterar foto</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </Label>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dados Pessoais</h3>
                  
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone/WhatsApp</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(24) 99999-9999"
                      required
                    />
                  </div>
                </div>


                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {userId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Endereços de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressManager userId={userId} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
