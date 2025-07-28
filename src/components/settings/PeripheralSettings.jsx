import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Printer, Scan, Settings, Save, TestTube, Search, CheckCircle, AlertCircle, Camera, FileText, Building } from 'lucide-react';
import peripheralsService from '@/lib/peripheralsService';
import fiscalService from '@/lib/fiscalService';

const PeripheralSettings = () => {
  const [peripheralConfig, setPeripheralConfig] = useState({
    printer: {
      type: 'epson',
      interface: 'USB',
      port: 'USB001',
      enabled: true
    },
    scanner: {
      deviceId: '',
      autoScan: true,
      enabled: true
    }
  });

  const [fiscalConfig, setFiscalConfig] = useState({
    nfe: {
      enabled: false,
      environment: 'homologation',
      series: '1',
      nextNumber: 1
    },
    sat: {
      enabled: false,
      environment: 'homologation',
      nextNumber: 1
    },
    general: {
      cnpj: '',
      inscricaoEstadual: '',
      razaoSocial: '',
      nomeFantasia: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [testingScanner, setTestingScanner] = useState(false);
  const [detectingDevices, setDetectingDevices] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState([]);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const { toast } = useToast();

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const [peripheral, fiscal] = await Promise.all([
        peripheralsService.getConfig(),
        fiscalService.getConfig()
      ]);
      setPeripheralConfig(peripheral);
      setFiscalConfig(fiscal);
    } catch (error) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePeripheralConfig = async () => {
    try {
      setLoading(true);
      await peripheralsService.saveConfig(peripheralConfig);
      toast({
        title: "Configurações salvas",
        description: "As configurações de periféricos foram salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFiscalConfig = async () => {
    try {
      setLoading(true);
      await fiscalService.saveConfig(fiscalConfig);
      toast({
        title: "Configurações fiscais salvas",
        description: "As configurações fiscais foram salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações fiscais",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testPrinter = async () => {
    try {
      setTestingPrinter(true);
      await peripheralsService.testPrinter(peripheralConfig.printer);
      toast({
        title: "Teste da impressora",
        description: "Impressora testada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no teste da impressora",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingPrinter(false);
    }
  };

  const testScanner = async () => {
    try {
      setTestingScanner(true);
      const result = await peripheralsService.testScanner(peripheralConfig.scanner);
      toast({
        title: "Teste do scanner",
        description: `Scanner testado com sucesso! Código de teste: ${result.testCode}`,
      });
    } catch (error) {
      toast({
        title: "Erro no teste do scanner",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingScanner(false);
    }
  };

  const scanBarcode = async () => {
    try {
      setTestingScanner(true);
      const result = await peripheralsService.scanBarcode(peripheralConfig.scanner);
      setLastScannedCode(result.barcode);
      toast({
        title: "Código de barras lido",
        description: `Código: ${result.barcode.text} (${result.barcode.format})`,
      });
    } catch (error) {
      toast({
        title: "Erro na leitura",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingScanner(false);
    }
  };

  const detectDevices = async () => {
    try {
      setDetectingDevices(true);
      const devices = await peripheralsService.detectDevices();
      setDetectedDevices(devices);
      toast({
        title: "Dispositivos detectados",
        description: `${devices.length} dispositivo(s) encontrado(s)!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao detectar dispositivos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDetectingDevices(false);
    }
  };

  const updatePeripheralConfig = (section, key, value) => {
    setPeripheralConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateFiscalConfig = (section, key, value) => {
    setFiscalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const validateCNPJ = (cnpj) => {
    if (!cnpj) return true;
    return fiscalService.validateCNPJ(cnpj);
  };

  const formatCNPJ = (cnpj) => {
    return fiscalService.formatCNPJ(cnpj);
  };

  const handleCNPJChange = (value) => {
    const formatted = formatCNPJ(value);
    updateFiscalConfig('general', 'cnpj', formatted);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'printer': return <Printer className="w-4 h-4" />;
      case 'scanner': return <Scan className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Configurações de Periféricos e Fiscal</h1>
      </div>

      {/* Detecção de Dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Detectar Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={detectDevices}
            disabled={detectingDevices}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {detectingDevices ? 'Detectando...' : 'Detectar Dispositivos'}
          </Button>

          {detectedDevices.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Dispositivos Encontrados:</h4>
              {detectedDevices.map((device, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getDeviceIcon(device.device_type)}
                  <div className="flex-1">
                    <div className="font-medium">{device.device_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.interface_type} - {device.port_address}
                    </div>
                  </div>
                  {device.is_connected ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuração da Impressora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Configuração da Impressora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="printer-enabled">Ativar Impressora</Label>
            <Switch
              id="printer-enabled"
              checked={peripheralConfig.printer.enabled}
              onCheckedChange={(checked) => updatePeripheralConfig('printer', 'enabled', checked)}
            />
          </div>

          {peripheralConfig.printer.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printer-type">Tipo de Impressora</Label>
                  <Select
                    value={peripheralConfig.printer.type}
                    onValueChange={(value) => updatePeripheralConfig('printer', 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="epson">Epson</SelectItem>
                      <SelectItem value="star">Star</SelectItem>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="bematech">Bematech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="printer-interface">Interface</Label>
                  <Select
                    value={peripheralConfig.printer.interface}
                    onValueChange={(value) => updatePeripheralConfig('printer', 'interface', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USB">USB</SelectItem>
                      <SelectItem value="Network">Rede</SelectItem>
                      <SelectItem value="Serial">Serial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="printer-port">Porta/Endereço</Label>
                <Input
                  id="printer-port"
                  value={peripheralConfig.printer.port}
                  onChange={(e) => updatePeripheralConfig('printer', 'port', e.target.value)}
                  placeholder="Ex: USB001, 192.168.1.100:9100"
                />
              </div>

              <Button
                onClick={testPrinter}
                disabled={testingPrinter}
                className="w-full"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testingPrinter ? 'Testando...' : 'Testar Impressora'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuração do Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Configuração do Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="scanner-enabled">Ativar Scanner</Label>
            <Switch
              id="scanner-enabled"
              checked={peripheralConfig.scanner.enabled}
              onCheckedChange={(checked) => updatePeripheralConfig('scanner', 'enabled', checked)}
            />
          </div>

          {peripheralConfig.scanner.enabled && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="scanner-auto">Escaneamento Automático</Label>
                <Switch
                  id="scanner-auto"
                  checked={peripheralConfig.scanner.autoScan}
                  onCheckedChange={(checked) => updatePeripheralConfig('scanner', 'autoScan', checked)}
                />
              </div>

              <div>
                <Label htmlFor="scanner-device">ID do Dispositivo</Label>
                <Input
                  id="scanner-device"
                  value={peripheralConfig.scanner.deviceId}
                  onChange={(e) => updatePeripheralConfig('scanner', 'deviceId', e.target.value)}
                  placeholder="Deixe vazio para auto-detecção"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  onClick={testScanner}
                  disabled={testingScanner}
                  className="w-full"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingScanner ? 'Testando...' : 'Testar Scanner'}
                </Button>

                <Button
                  onClick={scanBarcode}
                  disabled={testingScanner}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {testingScanner ? 'Lendo...' : 'Ler Código'}
                </Button>
              </div>

              {lastScannedCode && (
                <div className="p-3 border rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Último código lido:</h4>
                  <div className="text-sm">
                    <div><strong>Código:</strong> {lastScannedCode.text}</div>
                    <div><strong>Formato:</strong> {lastScannedCode.format}</div>
                    <div><strong>Hora:</strong> {new Date(lastScannedCode.timestamp).toLocaleTimeString('pt-BR')}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuração Fiscal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Configuração Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados Gerais */}
          <div className="space-y-4">
            <h4 className="font-medium">Dados da Empresa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={fiscalConfig.general.cnpj}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className={!validateCNPJ(fiscalConfig.general.cnpj) && fiscalConfig.general.cnpj ? 'border-red-500' : ''}
                />
                {!validateCNPJ(fiscalConfig.general.cnpj) && fiscalConfig.general.cnpj && (
                  <p className="text-sm text-red-500 mt-1">CNPJ inválido</p>
                )}
              </div>
              <div>
                <Label htmlFor="ie">Inscrição Estadual</Label>
                <Input
                  id="ie"
                  value={fiscalConfig.general.inscricaoEstadual}
                  onChange={(e) => updateFiscalConfig('general', 'inscricaoEstadual', e.target.value)}
                  placeholder="000.000.000.000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="razao-social">Razão Social</Label>
                <Input
                  id="razao-social"
                  value={fiscalConfig.general.razaoSocial}
                  onChange={(e) => updateFiscalConfig('general', 'razaoSocial', e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                <Input
                  id="nome-fantasia"
                  value={fiscalConfig.general.nomeFantasia}
                  onChange={(e) => updateFiscalConfig('general', 'nomeFantasia', e.target.value)}
                  placeholder="Nome fantasia"
                />
              </div>
            </div>
          </div>

          {/* NF-e */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="nfe-enabled">Ativar NF-e</Label>
              <Switch
                id="nfe-enabled"
                checked={fiscalConfig.nfe.enabled}
                onCheckedChange={(checked) => updateFiscalConfig('nfe', 'enabled', checked)}
              />
            </div>

            {fiscalConfig.nfe.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nfe-environment">Ambiente</Label>
                  <Select
                    value={fiscalConfig.nfe.environment}
                    onValueChange={(value) => updateFiscalConfig('nfe', 'environment', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologation">Homologação</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nfe-series">Série</Label>
                  <Input
                    id="nfe-series"
                    value={fiscalConfig.nfe.series}
                    onChange={(e) => updateFiscalConfig('nfe', 'series', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="nfe-next-number">Próximo Número</Label>
                  <Input
                    id="nfe-next-number"
                    type="number"
                    value={fiscalConfig.nfe.nextNumber}
                    onChange={(e) => updateFiscalConfig('nfe', 'nextNumber', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SAT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sat-enabled">Ativar SAT</Label>
              <Switch
                id="sat-enabled"
                checked={fiscalConfig.sat.enabled}
                onCheckedChange={(checked) => updateFiscalConfig('sat', 'enabled', checked)}
              />
            </div>

            {fiscalConfig.sat.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sat-environment">Ambiente</Label>
                  <Select
                    value={fiscalConfig.sat.environment}
                    onValueChange={(value) => updateFiscalConfig('sat', 'environment', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologation">Homologação</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sat-next-number">Próximo Número</Label>
                  <Input
                    id="sat-next-number"
                    type="number"
                    value={fiscalConfig.sat.nextNumber}
                    onChange={(e) => updateFiscalConfig('sat', 'nextNumber', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botões Salvar */}
      <div className="flex gap-4 justify-end">
        <Button onClick={savePeripheralConfig} disabled={loading} variant="outline">
          <Save className="w-4 h-4 mr-2" />
          Salvar Periféricos
        </Button>
        <Button onClick={saveFiscalConfig} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          Salvar Fiscal
        </Button>
      </div>
    </div>
  );
};

export default PeripheralSettings; 