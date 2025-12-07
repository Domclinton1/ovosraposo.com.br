import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderButton({ message = "Olá!VIm pelo site e quero fazer um pedido." }) {
  return (
    <Button
      asChild
      className="gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-md md:w-auto mx-auto flex justify-center "
    >
      <a
        href={`https://api.whatsapp.com/send/?phone=5524992502881&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-5 w-5" />
        Fazer Pedido pelo Whatsapp
      </a>
    </Button>
  );
}
