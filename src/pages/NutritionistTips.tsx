import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Award, BookOpen } from "lucide-react";
import nutricionistaImage from "@/assets/nutricionista.jpg";
import OrderButton from "@/components/OrderButton";

const NutritionistTips = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20 ">
        <section className="py-16 bg-background bg-red-700">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-white uppercase">
                Dicas da Nutricionista
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-white">
                Orientações profissionais para uma alimentação saudável e equilibrada
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="flex justify-center">
                <img 
                  src={nutricionistaImage} 
                  alt="Isabella Massad - Nutricionista" 
                  className="w-full max-w-3xl rounded-lg shadow-lg object-contain"
                />
              </div>
            </div>
          </div>
            <div className="p-10 flex">
                    <OrderButton/>
                  </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default NutritionistTips;
