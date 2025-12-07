import Header from "@/components/Header";
import DeliverySection from "@/components/DeliverySection";
import Footer from "@/components/Footer";

const Delivery = () => {
  return (
    <div className="min-h-screen bg-background ">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20">
        <DeliverySection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Delivery;
