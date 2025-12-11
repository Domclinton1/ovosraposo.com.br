"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsButton() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
      <a
        href="https://api.whatsapp.com/send/?phone=5524992502881&text=Olá! Gostaria de saber se vocês entregam no meu bairro.&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center"
      >
        {/* Texto recolhendo para dentro da bolinha */}
        <div
          className={
            "bg-green-600 text-white rounded-full shadow-lg whitespace-nowrap overflow-hidden transform transition-all duration-500 ease-in-out mr-2 " +
            (open
              ? "scale-x-100 opacity-100 px-4 py-2"
              : "scale-x-0 opacity-0 px-0 py-0")
          }
          style={{ transformOrigin: "right" }}
        >
          <span className="select-none">Faça seu pedido no WhatsApp</span>
        </div>

        {/* Bolinha com ícone do WhatsApp */}
        <div
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg cursor-pointer flex items-center justify-center transition-transform duration-300"
        >
          <FaWhatsapp className="h-6 w-6 text-white" /> {/* 👈 Ícone novo */}
        </div>
      </a>
    </div>
  );
}
