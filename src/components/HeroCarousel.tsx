import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroChickens from "@/assets/hero-chickens.jpg";
import heroDish from "@/assets/hero-dish.jpg";
import heroFarm from "@/assets/hero-farm.jpg";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
  {
    image: heroFarm, // se quiser posso criar novas imagens temáticas de Natal
    title: "Ovos Raposo",
    subtitle: "Tradição, carinho e sabor para sua ceia",
    description:
      "Neste Natal, leve para sua mesa o frescor e a qualidade dos nossos ovos especiais. Produção responsável para celebrar momentos inesquecíveis em família."
  },
  {
    image: heroDish,
    title: "Receitas Natalinas com Ovos Raposos",
    subtitle: "O ingrediente perfeito para suas melhores criações",
    description:
      "Do panetone caseiro ao pavê cremoso: nossos ovos garantem mais cor, textura e sabor em todas as suas receitas de fim de ano."
  },
  {
    image: heroChickens,
    title: "Clima de Natal na Ovos Raposos",
    subtitle: "Cuidado especial também nesta época mágica",
    description:
      "Enquanto você prepara sua ceia, nós cuidamos de cada detalhe na produção. Ovos frescos, nutritivos e feitos com amor — do campo para sua celebração."
  }
];


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 20000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section id="inicio" className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto px-4">
              <h1 className=" uppercase text-4xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-4 text-gray-200 animate-slide-up">
                {slide.subtitle}
              </p>
              <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-300 animate-slide-up">
                {slide.description}
              </p>
              <Button
                onClick={() => {
                  const productsSection = document.getElementById('produtos');
                  productsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-white text-xl px-8 py-4 animate-fade-in bg-red-700"
              >
                Compre Agora
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;