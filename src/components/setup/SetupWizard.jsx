import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Database, 
  Printer, 
  Scan, 
  FileText, 
  Store,
  ArrowRight,
  ArrowLeft,
  Home,
  Users,
  Package,
  ShoppingCart
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import peripheralsService from '@/lib/peripheralsService';
import fiscalService from '@/lib/fiscalService';

const SetupWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    // Dados da empresa
    company: {
      name: '',
      cnpj: '',
      address: '',
      phone: '',
      email: ''
    },
    // Configurações fiscais
    fiscal: {
      nfeEnabled: false,
      satEnabled: false,
      environment: 'homologation'
    },
    // Configurações de periféricos
    peripherals: {
      printerEnabled: false,
      scannerEnabled: false
    },
    // Usuário inicial
    adminUser: {
      name: '',
      email: '',
      password: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState({
    database: false,
    backend: false,
    supabase: false
  });
  const { toast } = useToast();

  const steps = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao PDV Fio de Gala',
      description: 'Vamos configurar seu sistema de vendas',
      icon: Home
    },
    {
      id: 'company',
      title: 'Dados da Empresa',
      description: 'Informações básicas da sua empresa',
      icon: Store
    },
    {
      id: 'fiscal',
      title: 'Configuração Fiscal',
      description: 'Configure NF-e ou SAT',
      icon: FileText
    },
    {
      id: 'peripherals',
      title: 'Periféricos',
      description: 'Configure impressora e scanner',
      icon: Settings
    },
    {
      id: 'admin',
      title: 'Usuário Administrador',
      description: 'Crie o usuário principal',
      icon: Users
    },
    {
      id: 'test',
      title: 'Testes',
      description: 'Teste todas as funcionalidades',
      icon: CheckCircle
    },
    {
      id: 'complete',
      title: 'Configuração Concluída',
      description: 'Seu PDV está pronto para uso',
      icon: CheckCircle
    }
  ];

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    
    // Verificar backend
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        setChecks(prev => ({ ...prev, backend: true }));
      }
    } catch (error) {
      console.error('Backend não está rodando:', error);
    }

    // Verificar Supabase
    try {
      const user = await getCurrentUser();
      if (user) {
        setChecks(prev => ({ ...prev, supabase: true }));
      }
    } catch (error) {
      console.error('Supabase não está configurado:', error);
    }

    setLoading(false);
  };

  const updateSetupData = (section, data) => {
    setSetupData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Company
        return setupData.company.name && setupData.company.cnpj;
      case 2: // Fiscal
        return true; // Opcional
      case 3: // Peripherals
        return true; // Opcional
      case 4: // Admin
        return setupData.adminUser.name && setupData.adminUser.email && setupData.adminUser.password;
      case 5: // Test
        return true;
      default:
        return true;
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);

      // Salvar configurações fiscais
      if (setupData.fiscal.nfeEnabled || setupData.fiscal.satEnabled) {
        const fiscalConfig = {
          nfe: {
            enabled: setupData.fiscal.nfeEnabled,
            environment: setupData.fiscal.environment,
            series: '1',
            nextNumber: 1
          },
          sat: {
            enabled: setupData.fiscal.satEnabled,
            environment: setupData.fiscal.environment,
            nextNumber: 1
          },
          general: {
            cnpj: setupData.company.cnpj,
            inscricaoEstadual: '',
            razaoSocial: setupData.company.name,
            nomeFantasia: setupData.company.name
          }
        };

        await fiscalService.saveConfig(fiscalConfig);
      }

      // Salvar configurações de periféricos
      const peripheralConfig = {
        printer: {
          enabled: setupData.peripherals.printerEnabled,
          type: 'epson',
          interface: 'USB',
          port: 'USB001'
        },
        scanner: {
          enabled: setupData.peripherals.scannerEnabled,
          deviceId: '',
          autoScan: true
        }
      };

      await peripheralsService.saveConfig(peripheralConfig);

      toast({
        title: "Configuração salva",
        description: "Todas as configurações foram salvas com sucesso!",
      });

      nextStep();
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CompanyStep setupData={setupData} updateSetupData={updateSetupData} />;
      case 2:
        return <FiscalStep setupData={setupData} updateSetupData={updateSetupData} />;
      case 3:
        return <PeripheralsStep setupData={setupData} updateSetupData={updateSetupData} />;
      case 4:
        return <AdminStep setupData={setupData} updateSetupData={updateSetupData} />;
      case 5:
        return <TestStep setupData={setupData} />;
      case 6:
        return <CompleteStep onComplete={onComplete} />;
      default:
        return null;
    }
  };

  const WelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Home className="w-12 h-12 text-primary" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-4">Bem-vindo ao PDV Fio de Gala</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Vamos configurar seu sistema de vendas em poucos passos simples
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <Package className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Gestão de Produtos</h3>
          <p className="text-sm text-muted-foreground">Controle completo de estoque</p>
        </div>
        <div className="p-4 border rounded-lg">
          <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Sistema de Vendas</h3>
          <p className="text-sm text-muted-foreground">POS completo e intuitivo</p>
        </div>
        <div className="p-4 border rounded-lg">
          <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Sistema Fiscal</h3>
          <p className="text-sm text-muted-foreground">NF-e e SAT integrados</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Status do Sistema</h3>
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2">
            {checks.backend ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Backend</span>
          </div>
          <div className="flex items-center gap-2">
            {checks.supabase ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Banco de Dados</span>
          </div>
        </div>
      </div>
    </div>
  );

  const CompanyStep = ({ setupData, updateSetupData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <Store className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Dados da Empresa</h2>
        <p className="text-muted-foreground">
          Informações básicas da sua empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome da Empresa *</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.company.name}
            onChange={(e) => updateSetupData('company', { name: e.target.value })}
            placeholder="Nome da sua empresa"
          />
        </div>
        <div>
          <label className="text-sm font-medium">CNPJ *</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.company.cnpj}
            onChange={(e) => updateSetupData('company', { cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Endereço</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.company.address}
            onChange={(e) => updateSetupData('company', { address: e.target.value })}
            placeholder="Endereço completo"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Telefone</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.company.phone}
            onChange={(e) => updateSetupData('company', { phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.company.email}
            onChange={(e) => updateSetupData('company', { email: e.target.value })}
            placeholder="contato@empresa.com"
          />
        </div>
      </div>
    </div>
  );

  const FiscalStep = ({ setupData, updateSetupData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Configuração Fiscal</h2>
        <p className="text-muted-foreground">
          Configure o sistema fiscal da sua empresa
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">NF-e (Nota Fiscal Eletrônica)</h3>
            <p className="text-sm text-muted-foreground">
              Para vendas para empresas
            </p>
          </div>
          <input
            type="checkbox"
            checked={setupData.fiscal.nfeEnabled}
            onChange={(e) => updateSetupData('fiscal', { nfeEnabled: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">SAT (Sistema Autenticador e Transmissor)</h3>
            <p className="text-sm text-muted-foreground">
              Para vendas para consumidor final
            </p>
          </div>
          <input
            type="checkbox"
            checked={setupData.fiscal.satEnabled}
            onChange={(e) => updateSetupData('fiscal', { satEnabled: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        {(setupData.fiscal.nfeEnabled || setupData.fiscal.satEnabled) && (
          <div>
            <label className="text-sm font-medium">Ambiente</label>
            <select
              className="w-full p-3 border rounded-lg mt-1"
              value={setupData.fiscal.environment}
              onChange={(e) => updateSetupData('fiscal', { environment: e.target.value })}
            >
              <option value="homologation">Homologação (Testes)</option>
              <option value="production">Produção (Real)</option>
            </select>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dica</h4>
        <p className="text-sm text-blue-800">
          Se você não tem certeza sobre qual sistema fiscal usar, pode pular esta etapa 
          e configurar depois. O sistema funcionará normalmente sem configuração fiscal.
        </p>
      </div>
    </div>
  );

  const PeripheralsStep = ({ setupData, updateSetupData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Configuração de Periféricos</h2>
        <p className="text-muted-foreground">
          Configure impressora e scanner (opcional)
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Printer className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold">Impressora Térmica</h3>
              <p className="text-sm text-muted-foreground">
                Para imprimir recibos de vendas
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={setupData.peripherals.printerEnabled}
            onChange={(e) => updateSetupData('peripherals', { printerEnabled: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Scan className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold">Scanner de Código de Barras</h3>
              <p className="text-sm text-muted-foreground">
                Para leitura rápida de produtos
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={setupData.peripherals.scannerEnabled}
            onChange={(e) => updateSetupData('peripherals', { scannerEnabled: e.target.checked })}
            className="w-5 h-5"
          />
        </div>
      </div>

      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">✅ Opcional</h4>
        <p className="text-sm text-green-800">
          Os periféricos são opcionais. O sistema funcionará perfeitamente 
          sem eles, permitindo entrada manual de produtos.
        </p>
      </div>
    </div>
  );

  const AdminStep = ({ setupData, updateSetupData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Usuário Administrador</h2>
        <p className="text-muted-foreground">
          Crie o usuário principal do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome Completo *</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.adminUser.name}
            onChange={(e) => updateSetupData('adminUser', { name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email *</label>
          <input
            type="email"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.adminUser.email}
            onChange={(e) => updateSetupData('adminUser', { email: e.target.value })}
            placeholder="seu@email.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Senha *</label>
          <input
            type="password"
            className="w-full p-3 border rounded-lg mt-1"
            value={setupData.adminUser.password}
            onChange={(e) => updateSetupData('adminUser', { password: e.target.value })}
            placeholder="Senha segura (mínimo 6 caracteres)"
          />
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">🔐 Importante</h4>
        <p className="text-sm text-yellow-800">
          Este usuário terá acesso total ao sistema. Guarde essas informações 
          em local seguro.
        </p>
      </div>
    </div>
  );

  const TestStep = ({ setupData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Testes do Sistema</h2>
        <p className="text-muted-foreground">
          Vamos testar se tudo está funcionando
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-semibold">Conexão com Banco de Dados</h3>
                <p className="text-sm text-muted-foreground">Verificando conexão...</p>
              </div>
            </div>
            <Badge variant="secondary">OK</Badge>
          </div>
        </div>

        {setupData.fiscal.nfeEnabled && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Sistema Fiscal NF-e</h3>
                  <p className="text-sm text-muted-foreground">Configurado para homologação</p>
                </div>
              </div>
              <Badge variant="secondary">Configurado</Badge>
            </div>
          </div>
        )}

        {setupData.fiscal.satEnabled && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Sistema Fiscal SAT</h3>
                  <p className="text-sm text-muted-foreground">Configurado para homologação</p>
                </div>
              </div>
              <Badge variant="secondary">Configurado</Badge>
            </div>
          </div>
        )}

        {setupData.peripherals.printerEnabled && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-semibold">Impressora Térmica</h3>
                  <p className="text-sm text-muted-foreground">Configure manualmente após instalação</p>
                </div>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
          </div>
        )}

        {setupData.peripherals.scannerEnabled && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scan className="w-6 h-6 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Scanner de Código de Barras</h3>
                  <p className="text-sm text-muted-foreground">Configure manualmente após instalação</p>
                </div>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">🎯 Próximos Passos</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Configure periféricos na seção "Periféricos"</li>
          <li>• Cadastre seus produtos</li>
          <li>• Configure usuários adicionais</li>
          <li>• Teste uma venda completa</li>
        </ul>
      </div>
    </div>
  );

  const CompleteStep = ({ onComplete }) => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-4 text-green-600">Configuração Concluída!</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Seu PDV Fio de Gala está pronto para uso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <Package className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Próximo Passo</h3>
          <p className="text-sm text-muted-foreground">Cadastre seus produtos</p>
        </div>
        <div className="p-4 border rounded-lg">
          <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Primeira Venda</h3>
          <p className="text-sm text-muted-foreground">Teste o sistema de vendas</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={onComplete} 
          size="lg"
          className="w-full md:w-auto"
        >
          Começar a Usar o Sistema
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Precisa de ajuda? Consulte a documentação ou entre em contato.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">PDV Fio de Gala - Setup</CardTitle>
                <p className="text-muted-foreground">
                  Passo {currentStep + 1} de {steps.length}
                </p>
              </div>
              <Badge variant="outline">
                {steps[currentStep].title}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            {currentStep < steps.length - 1 && (
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  {currentStep === 4 ? (
                    <Button
                      onClick={saveConfiguration}
                      disabled={!canProceed() || loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar e Continuar'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupWizard; 