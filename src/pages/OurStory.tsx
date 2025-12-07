import Header from "@/components/Header";
import OurStorySection from "@/components/OurStorySection";
import Footer from "@/components/Footer";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20">
        <OurStorySection />
      </main>
      
      <Footer />
    </div>
  );
};

export default OurStory;
