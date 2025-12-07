import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Aguardar o Supabase processar o callback automaticamente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro na sessão:', error);
          throw error;
        }

        if (session?.user) {
          // Verificar se perfil existe
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          // Criar perfil se não existir
          if (!profile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                user_id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || '',
                phone: session.user.user_metadata?.phone || '',
              });

            if (insertError) {
              console.error('Erro ao criar perfil:', insertError);
            }
          }

          toast.success('Login realizado com sucesso!');
          setTimeout(() => navigate('/'), 500);
        } else {
          throw new Error('Sessão não encontrada');
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        toast.error('Erro ao fazer login. Redirecionando...');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
      <div className="text-center p-8">
        {processing && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Processando login...
            </h2>
            <p className="text-gray-600">Aguarde um momento</p>
          </>
        )}
      </div>
    </div>
  );
}