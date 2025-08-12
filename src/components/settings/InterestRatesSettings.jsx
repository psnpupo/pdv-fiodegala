import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Save, Calculator, History, AlertCircle } from 'lucide-react';
import interestRatesService from '@/lib/interestRatesService';

const InterestRatesSettings = () => {
  const [creditCardInterest, setCreditCardInterest] = useState(2.99);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const { toast } = useToast();

  // Carregar configuração salva
  useEffect(() => {
    loadInterestRate();
    checkPermissions();
    loadCurrentConfig();
  }, []);

  const loadInterestRate = async () => {
    setLoading(true);
    try {
      const data = await interestRatesService.getInterestRate();
      setCreditCardInterest(data.credit_card_interest);
      setLastUpdated(data.updated_at);
    } catch (error) {
      console.error('Erro ao carregar taxa de juros:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a configuração de juros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermission = await interestRatesService.canManageInterestRates();
      setCanManage(hasPermission);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setCanManage(false);
    }
  };

  const loadCurrentConfig = async () => {
    try {
      const configData = await interestRatesService.getCurrentConfigWithAudit();
      setCurrentConfig(configData);
    } catch (error) {
      console.error('Erro ao carregar configuração atual:', error);
    }
  };

  // Salvar configuração
  const handleSave = async () => {
    if (!canManage) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para alterar as taxas de juros.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await interestRatesService.saveInterestRate(creditCardInterest);
      
      toast({
        title: "Configuração salva!",
        description: `Taxa de juros do cartão de crédito definida em ${creditCardInterest}% ao mês.`,
      });

      // Recarregar dados
      await loadInterestRate();
      await loadCurrentConfig();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração de juros.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calcular exemplo
  const calculateExample = (baseValue = 100, installments) => {
    if (installments <= 1) return baseValue;
    const monthlyInterest = creditCardInterest / 100;
    const totalInterest = Math.pow(1 + monthlyInterest, installments - 1) - 1;
    return baseValue * (1 + totalInterest);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Configuração de Taxas de Juros</h1>
      </div>

      {!canManage && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200">
              Você não tem permissão para alterar as taxas de juros. Apenas administradores e gerentes podem fazer alterações.
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Taxa de Juros - Cartão de Crédito
          </CardTitle>
          {lastUpdated && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="interest-rate" className="text-base font-medium">
                  Taxa de Juros Mensal
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Define a taxa de juros aplicada ao parcelamento do cartão de crédito
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="interest-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-32"
                    value={creditCardInterest}
                    onChange={(e) => setCreditCardInterest(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">% ao mês</span>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={loading || saving || !canManage}
                className="w-full md:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">
                Exemplo de Cálculo (R$ 100,00)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1x sem juros:</span>
                  <span className="font-medium">R$ 100,00</span>
                </div>
                <div className="flex justify-between">
                  <span>2x com juros:</span>
                  <span className="font-medium">R$ {calculateExample(100, 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>3x com juros:</span>
                  <span className="font-medium">R$ {calculateExample(100, 3).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>6x com juros:</span>
                  <span className="font-medium">R$ {calculateExample(100, 6).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>12x com juros:</span>
                  <span className="font-medium">R$ {calculateExample(100, 12).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Como funciona o cálculo:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• A primeira parcela não tem juros</li>
              <li>• As parcelas subsequentes acumulam juros compostos mensais</li>
              <li>• A taxa é aplicada sobre o valor restante a cada mês</li>
              <li>• O valor total é dividido igualmente entre as parcelas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Informações da configuração atual */}
      {currentConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Informações da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    Taxa atual: {currentConfig.credit_card_interest}% ao mês
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Criada em: {new Date(currentConfig.created_at).toLocaleString('pt-BR')}
                  </div>
                  {currentConfig.updated_at !== currentConfig.created_at && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Última alteração: {new Date(currentConfig.updated_at).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Configuração única
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterestRatesSettings; 