import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signInWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // Redirecionamento é tratado no useEffect
    } catch (error) {
      // Erro já é tratado no AuthContext (toast)
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      
      {/* Elementos decorativos no fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-8">
        <div className="bg-card border rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Trophy className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-center mb-2">
            Brasfoot Pro
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Faça login para acessar o painel de controle e gerenciar seu banco de dados.
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <FaGoogle className="w-5 h-5 text-red-500" />
            Entrar com Google
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Brasfoot Pro. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
