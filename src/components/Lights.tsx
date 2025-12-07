export default function Lights() {
  const lights = Array.from({ length: 50 });

  return (
    <div className="absolute top-0 left-0 w-full flex justify-center z-40 pointer-events-none">
      <div className="flex gap-2 py-2">
        {lights.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-4 rounded-full ${
              i % 3 === 0
                ? "bg-red-500 animate-blink"
                : i % 3 === 1
                ? "bg-green-500 animate-blink2"
                : "bg-yellow-400 animate-blink3"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
