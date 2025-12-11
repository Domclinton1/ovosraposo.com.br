import { useState } from "react";
import { Clock, Users, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderButton from "./OrderButton";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

/* -------------------------------------------
   COMPONENTE PARA CADA CARD DE RECEITA
-------------------------------------------- */
const RecipeCard = ({ recipe, getDifficultyColor }: any) => {
  const [showAll, setShowAll] = useState(false);

  const hasManySteps = recipe.instructions.length > 5;

  const instructionsToShow = showAll
    ? recipe.instructions
    : recipe.instructions.slice(0, 5);

  return (
    <Card className="h-full flex flex-col bg-card hover:shadow-[var(--shadow-warm)] transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-foreground uppercase">
            {recipe.name}
          </CardTitle>
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" /> {recipe.time}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" /> {recipe.servings} porções
          </div>
          <div className="flex items-center">
            <ChefHat className="h-4 w-4 mr-1" /> {recipe.difficulty}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Ingredientes */}
        <div>
          <h4 className="font-semibold text-foreground mb-2 uppercase">
            Ingredientes:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {recipe.ingredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-primary mr-2">•</span>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------
            MODO DE PREPARO
            BLOCO INTELIGENTE
        -------------------------------- */}
        {!hasManySteps && (
          <div>
            <h4 className="font-semibold text-foreground mb-2 uppercase">
              Modo de Preparo:
            </h4>

            <ol className="text-sm text-muted-foreground space-y-1">
              {recipe.instructions.map((instruction: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2 font-medium">
                    {index + 1}.
                  </span>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}

        {hasManySteps && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="modo-preparo">
              <AccordionTrigger className="uppercase font-semibold text-foreground">
                Modo de Preparo
              </AccordionTrigger>

              <AccordionContent>
                <ol className="text-sm text-muted-foreground space-y-1 mt-2">
                  {instructionsToShow.map((instruction: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2 font-medium">
                        {index + 1}.
                      </span>
                      {instruction}
                    </li>
                  ))}
                </ol>

                {recipe.instructions.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-3 text-primary font-semibold hover:underline text-sm"
                  >
                    {showAll ? "Ver menos ▲" : "Ver mais ▼"}
                  </button>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};


/* -------------------------------------------
   COMPONENTE PRINCIPAL
-------------------------------------------- */
const RecipesSection = () => {
  const recipes = [
    {
      id: 1,
      name: "Rabanada Tradicional",
      time: "20 min",
      servings: 4,
      difficulty: "Fácil",
      nutritionInfo: {
        energy: "240 kcal",
        protein: "6g",
        carbs: "35g",
        fat: "9g",
        calcium: "40mg"
      },
      ingredients: [
        "3 ovos",
        "1 baguete ou pão francês amanhecido",
        "1 xícara de leite",
        "3 colheres de açúcar",
        "1 colher de canela",
        "Óleo para fritar"
      ],
      instructions: [
        "Corte o pão em fatias grossas.",
        "Misture o leite com um pouco de açúcar.",
        "Bata os ovos em outra tigela.",
        "Passe o pão no leite e depois no ovo.",
        "Frite até dourar.",
        "Polvilhe açúcar e canela."
      ]
    },
    {
      id: 2,
      name: "Farofa Natalina com Ovo",
      time: "15 min",
      servings: 4,
      difficulty: "Fácil",
      nutritionInfo: {
        energy: "180 kcal",
        protein: "5g",
        carbs: "22g",
        fat: "7g",
        calcium: "20mg"
      },
      ingredients: [
        "2 ovos",
        "2 xícaras de farinha de mandioca",
        "½ cebola picada",
        "2 colheres de manteiga",
        "Passas, nozes, bacon (opcional)"
      ],
      instructions: [
        "Bata os ovos ligeiramente e faça ovos mexidos. Reserve.",
        "Refogue cebola e bacon na manteiga.",
        "Acrescente a farinha, misture bem.",
        "Adicione passas ou nozes.",
        "Finalize com os ovos mexidos."
      ]
    },
    {
      id: 3,
      name: "Bacalhau à Brás (Receita Tradicional Portuguesa)",
      time: "30 min",
      servings: 4,
      difficulty: "Média",
      nutritionInfo: {
        energy: "320 kcal",
        protein: "24g",
        carbs: "20g",
        fat: "16g",
        calcium: "65mg"
      },
      ingredients: [
        "400 g de bacalhau dessalgado e desfiado",
        "4 ovos",
        "3 batatas médias cortadas em palitos finos ou batata palha pronta",
        "1 cebola grande fatiada",
        "2 dentes de alho picados",
        "Azeite a gosto",
        "Salsa picada a gosto",
        "Azeitonas pretas (opcional)",
        "Sal e pimenta a gosto"
      ],
      instructions: [
        "Se estiver usando bacalhau salgado, deixe de molho por 24 horas, trocando a água 3 vezes.",
        "Frite as batatas até dourarem ou utilize batata palha industrializada.",
        "Refogue a cebola e o alho em azeite até ficarem macios.",
        "Acrescente o bacalhau desfiado e cozinhe por alguns minutos.",
        "Bata levemente os ovos com sal e pimenta.",
        "Misture as batatas ao bacalhau.",
        "Despeje os ovos batidos e mexa em fogo baixo até ficarem cremosos.",
        "Finalize com salsa picada e azeitonas."
      ]
    },
    {
      id: 4,
      name: "Crepioca com Farinha de Milho",
      time: "10 min",
      servings: 1,
      difficulty: "Fácil",
      nutritionInfo: {
        energy: "138 kcal",
        protein: "7.3g",
        carbs: "10.5g",
        fat: "6.2g",
        fiber: "3.1g"
      },
      ingredients: [
        "1 ovo Raposo (50g)",
        "2 colheres de sopa (20g) de farinha de milho flocão",
        "1 colher de chá (2g) de psyllium",
        "2 colheres de sopa (30ml) de água",
        "Sal a gosto"
      ],
      instructions: [
        "Misture todos os ingredientes até formar uma massa homogênea",
        "Aqueça uma frigideira antiaderente",
        "Despeje a massa na frigideira",
        "Cozinhe dos dois lados até dourar",
        "Recheie a gosto com seus ingredientes favoritos"
      ]
    },
    {
      id: 5,
      name: "Panqueca de Aveia com Banana",
      time: "15 min",
      servings: 1,
      difficulty: "Fácil",
      nutritionInfo: {
        energy: "260 kcal",
        protein: "13.2g",
        carbs: "22.4g",
        fat: "11.1g",
        fiber: "3.8g"
      },
      ingredients: [
        "2 ovos Raposo (100g)",
        "2 colheres de sopa (20g) de farelo de aveia",
        "1 banana média (80g)",
        "Canela a gosto"
      ],
      instructions: [
        "Amasse a banana em um recipiente",
        "Misture os ovos com a banana amassada",
        "Adicione o farelo de aveia e a canela",
        "Cozinhe em fogo baixo em frigideira antiaderente",
        "Vire quando dourar e cozinhe do outro lado"
      ]
    },
    {
      id: 6,
      name: "Pasta de Ovos Fit com Ricota",
      time: "10 min",
      servings: 1,
      difficulty: "Fácil",
      nutritionInfo: {
        energy: "180 kcal",
        protein: "13.8g",
        carbs: "1.5g",
        fat: "12.4g",
        calcium: "60mg"
      },
      ingredients: [
        "2 ovos Raposo cozidos (100g)",
        "1 colher de sopa (20g) de creme de ricota light",
        "Sal a gosto",
        "Pimenta a gosto",
        "Ervas frescas a gosto"
      ],
      instructions: [
        "Cozinhe os ovos até ficarem bem cozidos",
        "Descasque e amasse os ovos com um garfo",
        "Misture com o creme de ricota",
        "Tempere com sal, pimenta e ervas",
        "Sirva como recheio de tapioca, sanduíches ou com vegetais"
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-accent/20 text-accent-foreground border border-accent/30";
      case "Médio":
        return "bg-primary/20 text-primary-foreground border border-primary/30";
      case "Difícil":
        return "bg-destructive/20 text-destructive-foreground border border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  return (
    <section id="receitas" className="py-12 bg-red-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white uppercase">
            Receitas Deliciosas
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Sinta o aroma, a textura e o sabor irresistível de receitas fit preparadas com ovos frescos Raposo.
            Mais do que alimentação saudável, é nutrição com prazer, direto da granja para a sua mesa.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                getDifficultyColor={getDifficultyColor}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h4 className="text-3xl font-semibold text-foreground mb-4 uppercase">
                Receitas Fit e Nutritivas
              </h4>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nossas receitas são desenvolvidas com base na Tabela Brasileira de Composição de Alimentos (TACO),
                garantindo informações nutricionais precisas. Ovos frescos Raposo são a base perfeita para uma
                alimentação saudável e equilibrada, combinando sabor e nutrição em cada preparo.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="p-10 flex">
          <OrderButton />
        </div>
      </div>
    </section>
  );
};

export default RecipesSection;
