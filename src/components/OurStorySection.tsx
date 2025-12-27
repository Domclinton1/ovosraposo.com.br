import nossaHistoriaHero from "@/assets/nossa-historia-hero.png";
import OrderButton from "./OrderButton";
const OurStorySection = () => {
  return (
    <section id="nossa-historia" className="bg-white py-20 ">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="uppercase text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text  text-[#ee7923]">
            Nossa História
          </h2>

          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border ">
            <img
              src={nossaHistoriaHero}
              alt="Galinhas livres em nossa fazenda"
              className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
            />

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-foreground leading-relaxed mb-6">
                Em 2017, a paixão pela avicultura deu origem aos Ovos Raposo.
                Desde o início, nosso compromisso com o bem-estar animal nos
                levou a optar pela criação livre de gaiolas, onde as aves vivem
                em condições naturais, com amplo espaço, alimentação de
                qualidade, água fresca e ambientes adequados para a postura.
              </p>

              <p className="text-lg text-foreground leading-relaxed">
                Cada ovo passa por um rigoroso processo de lavagem,
                classificação e seleção, garantindo que apenas produtos de
                excelência cheguem até você. Nossa missão é levar diretamente da
                granja para sua mesa ovos frescos e saudáveis, fruto do cuidado
                genuíno que temos com nossos animais e com a satisfação de quem
                confia no nosso trabalho.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    2017
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ano de Fundação
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    100%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Galinhas Livres
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    Premium
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qualidade Garantida
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-10 flex">
          <OrderButton />
        </div>
      </div>
    </section>
  );
};
export default OurStorySection;
