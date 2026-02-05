import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function PartnerAuth() {
  const [searchParams] = useSearchParams();
  const partnerId = searchParams.get('partner');
  
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/partner" replace />;
  }

  const onLogin = async (data: LoginFormData) => {
    const { error } = await login(data.email, data.password);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
      navigate('/partner');
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    if (!partnerId) {
      toast({ 
        title: 'Erro', 
        description: 'Link de convite inválido. Solicite um novo convite ao administrador.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      const redirectUrl = `${window.location.origin}/partner`;

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({ title: 'Erro', description: 'Este e-mail já está cadastrado', variant: 'destructive' });
        } else {
          toast({ title: 'Erro', description: signUpError.message, variant: 'destructive' });
        }
        return;
      }

      if (authData.user) {
        // Link the partner record to this auth user
        const { error: linkError } = await (supabase
          .from('split_partners' as any)
          .update({ auth_user_id: authData.user.id } as any)
          .eq('id', partnerId) as any);

        if (linkError) {
          console.error('Error linking partner:', linkError);
        }

        // Create user role as partner
        const { error: roleError } = await (supabase
          .from('user_roles' as any)
          .insert({ 
            user_id: authData.user.id, 
            role: 'partner' 
          } as any) as any);

        if (roleError) {
          console.error('Error creating role:', roleError);
        }

        // Check if email confirmation is required
        if (!authData.session) {
          setEmailConfirmationSent(true);
          toast({ 
            title: 'Cadastro realizado!', 
            description: 'Verifique seu e-mail para confirmar o cadastro.' 
          });
        } else {
          toast({ title: 'Conta criada!', description: 'Sua conta foi criada com sucesso.' });
          navigate('/partner');
        }
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao criar conta', variant: 'destructive' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Parceiro</h1>
          <p className="text-muted-foreground text-sm">Msx Pay</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Acesse sua conta</CardTitle>
            <CardDescription>
              {partnerId 
                ? 'Crie sua conta de parceiro ou faça login' 
                : 'Entre com suas credenciais'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register" disabled={!partnerId}>
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {emailConfirmationSent && (
                <Alert className="mb-4 border-primary/50 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">
                    Um e-mail de confirmação foi enviado. Por favor, verifique sua caixa de entrada.
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                {!partnerId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Para criar uma conta de parceiro, você precisa de um link de convite.</p>
                    <p className="text-sm mt-2">Entre em contato com o administrador.</p>
                  </div>
                ) : (
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full gradient-primary" disabled={isRegistering}>
                        {isRegistering ? 'Criando conta...' : 'Criar conta'}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
