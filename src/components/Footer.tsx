import { Instagram, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoOvosRaposo from "@/assets/logo-ovos-raposo-colorida.jpg";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const institutionalLinks = [{
    name: "Quem Somos",
    href: "#quem-somos"
  }, {
    name: "Perguntas Frequentes",
    href: "#faq"
  }, {
    name: "Política de Privacidade",
    href: "#privacidade"
  }, {
    name: "Termos de Uso",
    href: "#termos"
  }];
  const socialLinks = [{
    name: "Instagram",
    icon: Instagram,
    url: "https://www.instagram.com/ovosraposo/",
    color: "hover:text-pink-500"
  }, {
    name: "WhatsApp",
    icon: MessageCircle,
    url: "https://api.whatsapp.com/send/?phone=5524992502881&text&type=phone_number&app_absent=0",
    color: "hover:text-green-500"
  }];
  return <footer id="contato" className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logoOvosRaposo} alt="Ovos Raposo" className="h-10 w-auto sm:h-12 md:h-14 transition-all" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Ovos frescos direto da granja para sua mesa. 
              Qualidade, sabor e nutrição em cada ovo que produzimos.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(social => <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className={`text-muted-foreground ${social.color} transition-colors p-2 hover:bg-muted rounded-lg`} aria-label={social.name}>
                  <social.icon className="h-5 w-5" />
                </a>)}
            </div>
          </div>

          {/* E-mails de Contato */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              E-mails de Contato
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Financeiro</span>
                  <a href="mailto:financeiro@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    financeiro@ovosraposo.com.br
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Vendas</span>
                  <a href="mailto:vendas@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    vendas@ovosraposo.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">SAC</span>
                  <a href="mailto:sac@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    sac@ovosraposo.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Galpão</span>
                  <a href="mailto:galpao@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    galpao@ovosraposo.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Logística</span>
                  <a href="mailto:logistica@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    logistica@ovosraposo.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Marketing</span>
                  <a href="mailto:marketing@ovosraposo.com.br" className="text-sm text-foreground hover:text-primary transition-colors">
                    marketing@ovosraposo.com.br
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contato e Endereço */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Fale Conosco
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <a href="https://wa.me/5524992502881" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    (24) 99250-2881
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    Estrada Arnaldo Dyckerhoff, 4110<br />
                    Posse - Petrópolis/RJ<br />
                    CEP: 25.770-130
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Navegação
            </h3>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Início
              </Link>
              <Link to="/produtos" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Produtos
              </Link>
              <Link to="/nossa-historia" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Nossa História
              </Link>
              <Link to="/receitas" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Receitas
              </Link>
              <Link to="/nutricao" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Nutrição
              </Link>
              <Link to="/dicas-nutricionista" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Dicas da Nutricionista
              </Link>
              <Link to="/entrega" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Entrega
              </Link>
            </div>
          </div>

          {/* Links Institucionais */}
          <div>
            
            
          </div>
        </div>

        {/* Linha Divisória */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Ovos Raposo. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Feito com ❤️ em Petrópolis</span>
            </div>
          </div>
        </div>

      </div>
    </footer>;
};
export default Footer;