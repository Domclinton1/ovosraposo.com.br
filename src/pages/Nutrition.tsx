import Header from "@/components/Header";
import NutritionSection from "@/components/NutritionSection";
import Footer from "@/components/Footer";

const Nutrition = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20">
        <NutritionSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Nutrition;
