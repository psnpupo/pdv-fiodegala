import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authenticateUser } from '@/lib/auth'; // setCurrentUser removed from here
import { ShoppingBag, Lock, User } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LOGIN] handleSubmit chamado');
    setLoading(true);

    try {
      console.log('[LOGIN] Antes do authenticateUser');
      const user = await authenticateUser(email, password);
      console.log('[LOGIN] Resultado do login:', user);
      if (user) {
        if (user.role === 'none') {
          toast({
            title: "Acesso restrito",
            description: "Seu usuário ainda não possui permissão de acesso. Solicite a um administrador para atribuir uma função (role).",
            variant: "destructive",
          });
          console.warn('[LOGIN] Usuário sem role, acesso bloqueado:', user);
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo, ${user.email}!`,
          });
          onLogin(user);
        }
      } else {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos, ou usuário sem permissão ativa.",
          variant: "destructive",
        });
        console.error('[LOGIN] Falha no login: usuário não encontrado ou sem permissão.');
      }
    } catch (error) {
      console.error('[LOGIN] Erro inesperado:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um problema ao tentar fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-fdg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-effect neon-glow">
          <CardHeader className="text-center">
            {/* Logo Fio de Gala */}
            <img src="/images/logobranca fdg.png" alt="Fio de Gala" className="mx-auto mb-4 w-32 h-32 object-contain" />
            <CardTitle className="text-2xl font-bold text-white">FDG System</CardTitle>
            <CardDescription className="text-gray-300">
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mail</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#3B657B] hover:bg-[#33566a] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-background/20 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Use o e-mail cadastrado no Supabase Authentication:</p>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Exemplo: admin@admin.com / sua senha</div>
                <div>Exemplo: gerente@empresa.com / sua senha</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;