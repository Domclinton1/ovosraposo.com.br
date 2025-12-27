import {
  Truck,
  Clock,
  MapPin,
  Gift,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderButton from "./OrderButton";
const DeliverySection = () => {
  const deliverySchedule = [
    {
      day: "Quarta-feira",
      dayShort: "Qua",
      neighborhoods: [
        "Centro",
        "Valparaíso",
        "Quitandinha",
        "Binguen",
        "Mosela",
        "Alto da Serra",
        "Alto Independência",
        "Fazenda Inglesa",
        "Castelanea",
        "Bonfim",
      ],
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      day: "Quinta-feira",
      dayShort: "Qui",
      neighborhoods: [
        "Retiro",
        "Corrêas",
        "Cascatinha",
        "Samambaia",
        "Quissamã",
      ],
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      day: "Sexta-feira",
      dayShort: "Sex",
      neighborhoods: [
        "Nogueira",
        "Itaipava",
        "Vale do Cuiabá",
        "Pedro do Rio",
        "Araras",
        "Secretário",
      ],
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
    },
  ];
  const deliveryFeatures = [
    {
      icon: Clock,
      title: "Horário de Entrega",
      description: "Quarta a Sexta-feira, das 08:00 às 16:00",
      highlight: true,
    },
    {
      icon: Gift,
      title: "Frete Grátis",
      description: "Para todos os bairros de Petrópolis - RJ",
      highlight: true,
    },
    {
      icon: Truck,
      title: "Logística Própria",
      description: "Controle total da qualidade desde a granja até sua casa",
      highlight: false,
    },
    {
      icon: Calendar,
      title: "Rotas Programadas",
      description: "Cada bairro tem seu dia específico de entrega",
      highlight: false,
    },
  ];
  return (
    <section id="entrega" className="py-16 bg-red-700">
      <div className="container mx-auto px-4 ">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-white uppercase">
            Entrega Rápida e Segura
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-white">
            Rotas programadas para garantir frescor e pontualidade na sua
            entrega
          </p>
        </div>

        {/* Destaques de Entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {deliveryFeatures.map((feature, index) => (
            <Card
              key={index}
              className={`bg-card text-center hover:shadow-[var(--shadow-warm)] transition-all hover:scale-105 ${
                feature.highlight ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="mx-auto mb-3">
                  <feature.icon
                    className={`h-8 w-8 ${
                      feature.highlight
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <CardTitle className="text-lg">
                  {feature.title}
                  {feature.highlight && (
                    <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
                      Destaque
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rotas de Entrega por Dia */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-white uppercase">
              Rotas de Entrega
            </h3>
            <p className="text-muted-foreground text-white">
              Confira o dia de entrega do seu bairro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {deliverySchedule.map((schedule, index) => (
              <Card
                key={index}
                className={`bg-gradient-to-br ${schedule.color} ${schedule.borderColor} border-2 hover:scale-105 transition-transform`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-primary mr-2" />
                    <Badge
                      variant="outline"
                      className="text-base font-semibold px-4 py-1"
                    >
                      {schedule.dayShort}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {schedule.day}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {schedule.neighborhoods.length} bairros atendidos
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {schedule.neighborhoods.map((neighborhood, nIndex) => (
                      <div
                        key={nIndex}
                        className="flex items-center p-2.5 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {neighborhood}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Informações Extras */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg uppercase">
                <Truck className="h-5 w-5 text-primary mr-2" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold mt-1 flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Faça seu pedido online até às 16:00
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold mt-1 flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  Preparamos seu pedido com cuidado na granja
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold mt-1 flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Entregamos no dia de rota do seu bairro, frescos e seguros
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg uppercase">
                <Gift className="h-5 w-5 text-primary mr-2" />
                Vantagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  Frete grátis para toda Petrópolis
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  Embalagem especial para proteção
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">
                  Rotas programadas para máximo frescor
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contato para Bairros não listados */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-6 text-center">
              <p className="text-white mb-4 uppercase">
                <strong className="text-foreground text-yellow-300">
                  Não encontrou seu bairro?
                </strong>{" "}
                Entre em contato conosco! Estamos sempre expandindo nossa área
                de cobertura.
              </p>
              <div className="p-10 flex">
                <OrderButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
export default DeliverySection;
