import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, User, LogOut, UserCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoOvosRaposo from "@/assets/logo-ovos-raposo-colorida.jpg";
import { FaWhatsapp } from "react-icons/fa";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
}

const Header = ({ cartItemsCount, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setUserRoles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
    } else if (data) {
      setCurrentUser(data);
    }

    // Load user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error('Erro ao carregar roles:', rolesError);
    } else if (rolesData) {
      setUserRoles(rolesData.map((r) => r.role));
    }
  };

  const navigationItems = [
    { name: "Início", href: "/" },
    { name: "Produtos", href: "/produtos" },
    { name: "Nossa História", href: "/nossa-historia" },
    { name: "Receitas", href: "/receitas" },
    { name: "Nutrição", href: "/nutricao" },
    { name: "Dicas da Nutricionista", href: "/dicas-nutricionista" },
    { name: "Entrega", href: "/entrega" },
    { name: "Contato", href: "/contato" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRoles([]);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/auth");
  };

  return (
    <header className="bg-background shadow-[var(--shadow-card)] sticky top-0 z-50">
     

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logoOvosRaposo} 
              alt="Ovos Raposo" 
              className="h-10 w-auto cursor-pointer sm:h-12 md:h-14 lg:h-16 transition-all" 
              onClick={() => navigate('/')}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="nav-link text-sm lg:text-base text-foreground hover:text-primary font-medium transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User & Cart Actions */}
          <div className="flex items-center space-x-4">
  {currentUser ? (
    <div className="hidden md:flex items-center space-x-2 bg-red-700 text-white">
      <span className="text-sm text-foreground">
        Olá, {currentUser.full_name?.split(' ')[0] || 'Usuário'}
      </span>
      <Button
        onClick={() => navigate("/profile")}
        variant="ghost"
        size="sm"
        className="text-sm"
      >
        <UserCircle className="h-4 w-4 mr-1" />
        Perfil
      </Button>
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="text-sm"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sair
      </Button>
    </div>
  ) : (
    <>
      {/* Botão do WhatsApp antes do botão de entrar */}
      <Button
        onClick={() =>
          window.open(
            "https://wa.me/5524992502881?text=Olá,%20vim%20pelo%20site%20e%20gostaria%20de%20fazer%20um%20pedido",
            "_blank"
          )
        }
        variant="ghost"
        size="sm"
        className="text-white bg-red-700 hover:bg-green-700 p-2 uppercase  hover:text-white"
      > 
        <FaWhatsapp className="h-5 w-5" />
        Falar no Whatsapp
      </Button>

      <Button
        onClick={handleLoginClick}
        variant="ghost"
        size="sm"
        className="hidden md:flex text-sm bg-red-700 text-white uppercase"
      >
        <User className="h-4 w-4 mr-1" />
        Entrar
      </Button>
    </>
  )}

  {/* Botão do carrinho */}
  <Button
    onClick={onCartClick}
    variant="outline"
    size="sm"
    className="relative bg-red-700 text-white"
  >
    <ShoppingCart className="h-5 w-5" />
    {cartItemsCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle">
        {cartItemsCount}
      </span>
    )}
  </Button>

  {/* Botão do menu móvel */}
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden text-white"
    onClick={() => setIsMenuOpen(!isMenuOpen)}
  >
    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
  </Button>
</div>

        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-left px-2 py-2 text-foreground hover:text-primary font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile User Actions */}
              <div className="pt-2 border-t border-border">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="px-2 py-1 text-sm text-foreground">
                      Olá, {currentUser.full_name?.split(' ')[0] || 'Usuário'}
                    </div>
                    <button
                      onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}
                      className="flex items-center px-2 py-2 text-foreground hover:text-primary font-medium transition-colors"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-2 py-2 text-foreground hover:text-primary font-medium transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center px-2 py-2 text-foreground hover:text-primary font-medium transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Entrar / Criar Conta
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;