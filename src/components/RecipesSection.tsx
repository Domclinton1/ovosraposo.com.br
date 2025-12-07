import { Clock, Users, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderButton from "./OrderButton";
const RecipesSection = () => {
  const recipes = [{
    id: 1,
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
    ingredients: ["1 ovo Raposo (50g)", "2 colheres de sopa (20g) de farinha de milho flocão", "1 colher de chá (2g) de psyllium", "2 colheres de sopa (30ml) de água", "Sal a gosto"],
    instructions: ["Misture todos os ingredientes até formar uma massa homogênea", "Aqueça uma frigideira antiaderente", "Despeje a massa na frigideira", "Cozinhe dos dois lados até dourar", "Recheie a gosto com seus ingredientes favoritos"]
  }, {
    id: 2,
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
    ingredients: ["2 ovos Raposo (100g)", "2 colheres de sopa (20g) de farelo de aveia", "1 banana média (80g)", "Canela a gosto"],
    instructions: ["Amasse a banana em um recipiente", "Misture os ovos com a banana amassada", "Adicione o farelo de aveia e a canela", "Cozinhe em fogo baixo em frigideira antiaderente", "Vire quando dourar e cozinhe do outro lado"]
  }, {
    id: 3,
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
    ingredients: ["2 ovos Raposo cozidos (100g)", "1 colher de sopa (20g) de creme de ricota light", "Sal a gosto", "Pimenta a gosto", "Ervas frescas a gosto"],
    instructions: ["Cozinhe os ovos até ficarem bem cozidos", "Descasque e amasse os ovos com um garfo", "Misture com o creme de ricota", "Tempere com sal, pimenta e ervas", "Sirva como recheio de tapioca, sanduíches ou com vegetais"]
  }];
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
  return <section id="receitas" className="py-12 bg-background bg-red-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-white uppercase">
            Receitas Deliciosas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-white">Sinta o aroma, a textura e o sabor irresistível de receitas fit preparadas com ovos frescos Raposo.
Mais do que alimentação saudável, é nutrição com prazer, direto da granja para a sua mesa.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Recipes list */}
          <div className="space-y-6">
            {recipes.map(recipe => <Card key={recipe.id} className="bg-card hover:shadow-[var(--shadow-warm)] transition-all duration-300">
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
                      <Clock className="h-4 w-4 mr-1" />
                      {recipe.time}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {recipe.servings} porções
                    </div>
                    <div className="flex items-center">
                      <ChefHat className="h-4 w-4 mr-1" />
                      {recipe.difficulty}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 uppercase">Ingredientes:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {recipe.ingredients.map((ingredient, index) => <li key={index} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {ingredient}
                        </li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2 uppercase">Modo de preparo:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      {recipe.instructions.map((instruction, index) => <li key={index} className="flex items-start">
                          <span className="text-primary mr-2 font-medium">{index + 1}.</span>
                          {instruction}
                        </li>)}
                    </ol>
                  </div>
                </CardContent>
              </Card>)}
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
      </div>
        <div className="p-10 flex">
                <OrderButton/>
              </div>
    </section>;
};
export default RecipesSection;