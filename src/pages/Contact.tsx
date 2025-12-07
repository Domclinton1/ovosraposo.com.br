import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
      />
      
      <main className="pt-20 pb-0">
        {/* O Footer já contém todas as informações de contato */}
      </main>
      
      <Footer  />
    </div>
  );
};

export default Contact;
