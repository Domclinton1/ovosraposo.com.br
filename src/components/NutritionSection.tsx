import { Heart, Zap, Shield, Baby } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderButton from "./OrderButton";
const NutritionSection = () => {
  const nutritionFacts = [
    {
      nutrient: "Energia",
      value: "71,5 kcal",
      unit: "por ovo",
    },
    {
      nutrient: "Proteínas",
      value: "6,5g",
      unit: "alta qualidade",
    },
    {
      nutrient: "Lipídios",
      value: "4,45g",
      unit: "gorduras boas",
    },
    {
      nutrient: "Carboidratos",
      value: "0,8g",
      unit: "baixo teor",
    },
    {
      nutrient: "Colesterol",
      value: "178 mg",
      unit: "controle necessário",
    },
    {
      nutrient: "Cálcio",
      value: "21 mg",
      unit: "ossos fortes",
    },
    {
      nutrient: "Ferro",
      value: "0,8 mg",
      unit: "previne anemia",
    },
    {
      nutrient: "Sódio",
      value: "84 mg",
      unit: "equilíbrio",
    },
    {
      nutrient: "Magnésio",
      value: "6 mg",
      unit: "energia celular",
    },
    {
      nutrient: "Fósforo",
      value: "95 mg",
      unit: "saúde óssea",
    },
    {
      nutrient: "Potássio",
      value: "69 mg",
      unit: "função cardíaca",
    },
    {
      nutrient: "Zinco",
      value: "0,65 mg",
      unit: "imunidade",
    },
    {
      nutrient: "Vitamina A",
      value: "70 μg",
      unit: "visão saudável",
    },
    {
      nutrient: "Vitamina D",
      value: "1 μg",
      unit: "ossos fortes",
    },
    {
      nutrient: "Vitamina E",
      value: "0,53 mg",
      unit: "antioxidante",
    },
    {
      nutrient: "Vitamina B12",
      value: "0,63 μg",
      unit: "sistema nervoso",
    },
  ];
  const benefits = [
    {
      icon: Zap,
      title: "Energia Duradoura",
      description:
        "Proteínas de alta qualidade fornecem energia sustentada ao longo do dia",
      color: "text-primary",
    },
    {
      icon: Heart,
      title: "Fortalecimento Muscular",
      description:
        "Aminoácidos essenciais ajudam na construção e manutenção dos músculos",
      color: "text-destructive",
    },
    {
      icon: Shield,
      title: "Sistema Imunológico",
      description:
        "Rico em vitaminas e minerais que fortalecem suas defesas naturais",
      color: "text-accent-foreground",
    },
    {
      icon: Baby,
      title: "Desenvolvimento Infantil",
      description:
        "Nutrientes essenciais para o crescimento saudável das crianças",
      color: "text-primary-glow",
    },
  ];
  return (
    <section id="nutricao" className="py-16 bg-muted/30 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold  mb-4 text-[#ee7923] uppercase">
            Nutrição de Qualidade
          </h2>
          <p className="text-lg  max-w-2xl mx-auto text-muted-foreground">
            Cada ovo é uma fonte completa de nutrientes essenciais para uma vida
            saudável
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Tabela Nutricional */}
          <div>
            <h3 className="text-2xl font-semibold  mb-6 text-[#faaf40] uppercase">
              Informações Nutricionais
            </h3>
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {nutritionFacts.map((fact, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
                    >
                      <span className="font-medium text-foreground">
                        {fact.nutrient}
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">
                          {fact.value}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {fact.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  * Valores baseados em um ovo médio (50g)
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefícios */}
          <div>
            <h3 className="text-2xl font-semibold  mb-6 text-[#faaf40] uppercase">
              Benefícios para sua Saúde
            </h3>
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="bg-card hover:shadow-[var(--shadow-warm)] transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <benefit.icon
                        className={`h-6 w-6 mr-3 ${benefit.color}`}
                      />
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h4 className="text-3xl uppercase font-semibold text-foreground mb-4 text-red-500">
                Por que Escolher Ovos Raposo?
              </h4>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nossos ovos são produzidos por galinhas criadas livres, em
                ambiente natural, e alimentadas exclusivamente com ração
                selecionada e balanceada. Esse cuidado especial resulta em ovos
                mais nutritivos, com gemas intensamente douradas e sabor
                incomparável. Escolher nossos ovos é escolher o melhor para a
                saúde e o bem-estar da sua família. Qualidade que você vê, sente
                e saboreia em cada ovo.
              </p>
            </CardContent>
            <OrderButton />
          </Card>
        </div>
      </div>
    </section>
  );
};
export default NutritionSection;
