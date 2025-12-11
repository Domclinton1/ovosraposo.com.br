import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import eggs12 from "@/assets/eggs-12.jpg";
import eggs12White from "@/assets/eggs-12-white.png";
import eggs12Red from "@/assets/eggs-12-red.png";
import eggs20 from "@/assets/eggs-20.jpg";
import eggs20White from "@/assets/eggs-20-white.png";
import eggs20Red from "@/assets/eggs-20-red.png";
import eggs30 from "@/assets/eggs-30.jpg";
import eggs30White from "@/assets/eggs-30-white.png";
import eggs30Red from "@/assets/eggs-30-red.png";
import OrderButton from "./OrderButton";
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  description: string;
}
interface ProductsSectionProps {
  onAddToCart: (product: Product) => void;
}
const ProductsSection = ({
  onAddToCart
}: ProductsSectionProps) => {
  const {
    toast
  } = useToast();
  const products: Product[] = [{
    id: 1,
    name: "12 Ovos Extra Branco",
    quantity: 12,
    price: 11.95,
    image: eggs12White,
    description: "O sabor e a leveza que sua mesa merece todos os dias."
  }, {
    id: 2,
    name: "20 Ovos Extra Branco",
    quantity: 20,
    price: 17.89,
    image: eggs20White,
    description: "O clássico da cozinha brasileira em sua melhor versão."
  }, {
    id: 3,
    name: "30 Ovos Extra Branco",
    quantity: 30,
    price: 25.99,
    image: eggs30White,
    description: "Volume perfeito para quem precisa de praticidade todos os dias."
  }, {
    id: 4,
    name: "12 Ovos Extra Vermelho",
    quantity: 12,
    price: 12.99,
    image: eggs12Red,
    description: "O sabor e a leveza que sua mesa merece todos os dias."
  }, {
    id: 5,
    name: "20 Ovos Extra Vermelho",
    quantity: 20,
    price: 20.99,
    image: eggs20Red,
    description: "O clássico da cozinha brasileira em sua melhor versão."
  }, {
    id: 6,
    name: "30 Ovos Extra Vermelho",
    quantity: 30,
    price: 30.90,
    image: eggs30Red,
    description: "Volume perfeito para quem precisa de praticidade todos os dias."
  }];
  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho`
    });
  };
  return <section id="produtos" className="py-16 bg-background bg-red-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-white text-3xl md:text-4xl font-bold text-foreground mb-4 uppercase">
            Nossos Produtos
          </h2>
          <p className="text-white text-lg text-muted-foreground max-w-2xl mx-auto">Mais frescor, mais sabor, mais nutrição. Nossos ovos chegam direto da granja para garantir o melhor para você e sua família. Escolha a quantidade ideal para suas receitas.</p>
          <div className="p-10 flex">
            <OrderButton/>
        </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map(product => <Card key={product.id} className="product-card bg-card border-border">
              <CardContent className="p-6">
                <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {product.description}
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4 italic">
                  Tamanho do ovo: 58g a 67.99g
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.quantity} unidades
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button onClick={() => handleAddToCart(product)} className="w-full bg-primary hover:bg-primary-glow text-primary-foreground bg-red-700 text-white uppercase">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </CardFooter>
            </Card>)

            }
            
        </div>
      </div>
        <div className="p-10 flex">
                <OrderButton/>
        </div>
    </section>;
};
export default ProductsSection;