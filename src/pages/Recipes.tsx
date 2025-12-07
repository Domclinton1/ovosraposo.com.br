import Header from "@/components/Header";
import RecipesSection from "@/components/RecipesSection";
import Footer from "@/components/Footer";

const Recipes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20">
        <RecipesSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Recipes;
