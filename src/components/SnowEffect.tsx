import React, { useEffect, useState } from "react";

export default function SnowEffect() {
  const [flakes, setFlakes] = useState([]);

  const generateSnow = () => {
    const snow = [];
    const totalFlakes = 80; // quantidade de flocos

    for (let i = 0; i < totalFlakes; i++) {
      snow.push({
        id: i,
        left: Math.random() * 100, // posição horizontal
        duration: 5 + Math.random() * 5, // velocidade (5–10s)
        delay: Math.random() * 5, // delay inicial
      });
    }

    setFlakes(snow);
  };

  useEffect(() => {
    // gera a neve ao iniciar
    generateSnow();

    // reinicia o efeito a cada 10s após terminar
    const interval = setInterval(() => {
      setFlakes([]); // limpa os flocos
      setTimeout(() => generateSnow(), 200); // recria com pequeno delay
    }, 15000); // 15s (10s efeito + 5s extra p/ garantir fim da animação)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[9999]">
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="absolute top-[-10px] text-white"
          style={{
            left: `${flake.left}%`,
            fontSize: `${Math.random() * 10 + 8}px`,
            animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
          }}
        >
          ❄
        </span>
      ))}

      {/* CSS da animação */}
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(0vh); opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
