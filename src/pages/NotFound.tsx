import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface">
      <div className="text-center space-y-6 p-4">
        <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-4xl font-bold text-destructive">404</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">
            A página que você procura não existe ou foi movida.
          </p>
        </div>
        <a 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-6 bg-gradient-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition-transform shadow-medium"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
