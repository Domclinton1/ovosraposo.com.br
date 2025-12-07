import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsButton() {
  return (
    <Button
      asChild
      className="fixed bottom-6 right-6 z-50 gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg uppercase"
    >
      <a
        href="https://api.whatsapp.com/send/?phone=5524992502881&text=Olá! Gostaria de saber se vocês entregam no meu bairro.&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-5 w-5 text-white" />
        Falar no WhatsApp
      </a>
    </Button>
  );
}
