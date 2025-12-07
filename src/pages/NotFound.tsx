import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <Link to="/" className="text-primary underline hover:text-primary-glow transition-colors">
          Voltar para Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
