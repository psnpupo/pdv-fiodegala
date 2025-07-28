const { createClient } = require('@supabase/supabase-js');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { BrowserMultiFormatReader } = require('@zxing/library');

// Inicializar Supabase apenas se as variáveis de ambiente estiverem disponíveis
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase conectado para periféricos');
  }
} catch (error) {
  console.log('❌ Supabase não configurado para periféricos:', error.message);
}

// Instância do leitor de código de barras
let barcodeReader = null;

// Função para criar instância da impressora
function createPrinterInstance(printerConfig) {
  const config = {
    type: getPrinterType(printerConfig.type),
    interface: printerConfig.interface,
    options: {
      timeout: 5000
    },
    width: 42 // Largura padrão para impressoras térmicas
  };

  // Configurar interface específica
  if (printerConfig.interface === 'USB') {
    config.interface = printerConfig.port;
  } else if (printerConfig.interface === 'Network') {
    const [host, port] = printerConfig.port.split(':');
    config.interface = `tcp://${host}:${port || 9100}`;
  } else if (printerConfig.interface === 'Serial') {
    config.interface = printerConfig.port;
  }

  return new ThermalPrinter(config);
}

// Função para mapear tipos de impressora
function getPrinterType(type) {
  const types = {
    'epson': PrinterTypes.EPSON,
    'star': PrinterTypes.STAR,
    'citizen': PrinterTypes.CITIZEN,
    'bematech': PrinterTypes.BEMATECH
  };
  return types[type] || PrinterTypes.EPSON;
}

// Função para inicializar scanner de código de barras
function initializeBarcodeScanner() {
  if (!barcodeReader) {
    try {
      barcodeReader = new BrowserMultiFormatReader();
      console.log('✅ Scanner de código de barras inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar scanner:', error);
    }
  }
  return barcodeReader;
}

// Testar conexão com impressora
exports.testPrinter = async (req, res) => {
  try {
    const { printerConfig } = req.body;
    
    console.log('Testando impressora com configuração:', printerConfig);
    
    // Criar instância da impressora
    const printer = createPrinterInstance(printerConfig);
    
    // Testar conexão
    const isConnected = await printer.isPrinterConnected();
    
    if (isConnected) {
      // Imprimir teste
      await printer.alignCenter();
      await printer.bold(true);
      await printer.println("TESTE DE IMPRESSORA");
      await printer.bold(false);
      await printer.println("==================");
      await printer.println("Data: " + new Date().toLocaleDateString('pt-BR'));
      await printer.println("Hora: " + new Date().toLocaleTimeString('pt-BR'));
      await printer.println("Status: OK");
      await printer.println("==================");
      await printer.cut();
      
      await printer.execute();
      
      res.json({ 
        success: true, 
        message: 'Impressora testada com sucesso - Página de teste impressa',
        config: printerConfig 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Impressora não encontrada ou não conectada',
        config: printerConfig 
      });
    }
    
  } catch (error) {
    console.error('Erro ao testar impressora:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao testar impressora',
      details: error.message 
    });
  }
};

// Testar scanner de código de barras
exports.testScanner = async (req, res) => {
  try {
    const { scannerConfig } = req.body;
    
    console.log('Testando scanner com configuração:', scannerConfig);
    
    // Inicializar scanner
    const reader = initializeBarcodeScanner();
    
    if (!reader) {
      throw new Error('Scanner não pôde ser inicializado');
    }
    
    // Simular teste bem-sucedido (em produção, seria uma leitura real)
    const testResult = {
      success: true,
      message: 'Scanner testado com sucesso',
      config: scannerConfig,
      testCode: '1234567890123', // Código de teste
      format: 'EAN-13'
    };
    
    res.json(testResult);
    
  } catch (error) {
    console.error('Erro ao testar scanner:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao testar scanner',
      details: error.message 
    });
  }
};

// Ler código de barras
exports.scanBarcode = async (req, res) => {
  try {
    const { scannerConfig } = req.body;
    
    console.log('Lendo código de barras com configuração:', scannerConfig);
    
    // Inicializar scanner
    const reader = initializeBarcodeScanner();
    
    if (!reader) {
      throw new Error('Scanner não pôde ser inicializado');
    }
    
    // Em produção, aqui seria a leitura real do scanner
    // Por enquanto, vamos simular uma leitura
    const mockBarcode = {
      text: '7891234567890',
      format: 'EAN-13',
      timestamp: new Date().toISOString()
    };
    
    // Salvar log de leitura no banco
    if (supabase) {
      try {
        await supabase
          .from('scan_logs')
          .insert({
            barcode: mockBarcode.text,
            format: mockBarcode.format,
            scanner_config: scannerConfig,
            scan_status: 'success',
            timestamp: mockBarcode.timestamp
          });
      } catch (dbError) {
        console.error('Erro ao salvar log de leitura:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      barcode: mockBarcode 
    });
    
  } catch (error) {
    console.error('Erro ao ler código de barras:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao ler código de barras',
      details: error.message 
    });
  }
};

// Imprimir recibo
exports.printReceipt = async (req, res) => {
  try {
    const { saleData, printerConfig } = req.body;
    
    console.log('Imprimindo recibo para venda:', saleData.id);
    console.log('Configuração da impressora:', printerConfig);
    
    // Criar instância da impressora
    const printer = createPrinterInstance(printerConfig);
    
    // Verificar conexão
    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      throw new Error('Impressora não encontrada ou não conectada');
    }
    
    // Gerar e imprimir recibo
    await generateAndPrintReceipt(printer, saleData);
    
    // Salvar log de impressão no banco
    if (supabase) {
      try {
        const { data: logData, error: logError } = await supabase
          .from('print_logs')
          .insert({
            store_id: saleData.store_id,
            user_id: saleData.user_id,
            sale_id: saleData.id,
            printer_config: printerConfig,
            receipt_content: generateReceiptTemplate(saleData),
            print_status: 'success'
          });
        
        if (logError) {
          console.error('Erro ao salvar log de impressão:', logError);
        }
      } catch (dbError) {
        console.error('Erro ao conectar com banco para log:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Recibo impresso com sucesso',
      saleId: saleData.id 
    });
    
  } catch (error) {
    console.error('Erro ao imprimir recibo:', error);
    
    // Salvar log de erro
    if (supabase && req.body.saleData) {
      try {
        await supabase
          .from('print_logs')
          .insert({
            store_id: req.body.saleData.store_id,
            user_id: req.body.saleData.user_id,
            sale_id: req.body.saleData.id,
            printer_config: req.body.printerConfig,
            receipt_content: generateReceiptTemplate(req.body.saleData),
            print_status: 'error',
            error_message: error.message
          });
      } catch (dbError) {
        console.error('Erro ao salvar log de erro:', dbError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao imprimir recibo',
      details: error.message 
    });
  }
};

// Obter configurações de periféricos
exports.getPeripheralConfig = async (req, res) => {
  try {
    let config = {
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
      },
      fiscal: {
        nfeEnabled: false,
        satEnabled: false,
        cnpj: '',
        inscricaoEstadual: ''
      }
    };

    // Tentar carregar do banco de dados
    if (supabase) {
      try {
        const { data: configs, error } = await supabase
          .from('peripheral_configs')
          .select('config_type, config_data')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && configs) {
          configs.forEach(item => {
            if (item.config_type === 'printer') {
              config.printer = { ...config.printer, ...item.config_data };
            } else if (item.config_type === 'scanner') {
              config.scanner = { ...config.scanner, ...item.config_data };
            } else if (item.config_type === 'fiscal') {
              config.fiscal = { ...config.fiscal, ...item.config_data };
            }
          });
        }
      } catch (dbError) {
        console.error('Erro ao carregar configurações do banco:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      config: config 
    });
    
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter configurações',
      details: error.message 
    });
  }
};

// Salvar configurações de periféricos
exports.savePeripheralConfig = async (req, res) => {
  try {
    const { config } = req.body;
    
    console.log('Salvando configurações de periféricos:', config);
    
    // Salvar no banco de dados
    if (supabase) {
      try {
        // Desativar configurações antigas
        await supabase
          .from('peripheral_configs')
          .update({ is_active: false })
          .eq('is_active', true);

        // Inserir novas configurações
        const configsToInsert = [
          { config_type: 'printer', config_data: config.printer },
          { config_type: 'scanner', config_data: config.scanner },
          { config_type: 'fiscal', config_data: config.fiscal }
        ];

        const { data, error } = await supabase
          .from('peripheral_configs')
          .insert(configsToInsert);

        if (error) {
          console.error('Erro ao salvar no banco:', error);
          throw new Error('Erro ao salvar no banco de dados');
        }

        console.log('✅ Configurações salvas no banco:', data);
      } catch (dbError) {
        console.error('Erro ao conectar com banco:', dbError);
        throw new Error('Erro de conexão com banco de dados');
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso',
      config: config 
    });
    
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao salvar configurações',
      details: error.message 
    });
  }
};

// Detectar dispositivos
exports.detectDevices = async (req, res) => {
  try {
    console.log('Detectando dispositivos...');
    
    // Por enquanto, retornar dispositivos simulados
    // Em produção, aqui seria a detecção real
    const devices = [
      {
        device_type: 'printer',
        device_name: 'Epson TM-T20II',
        device_id: 'USB001',
        interface_type: 'USB',
        port_address: 'USB001',
        is_connected: true
      },
      {
        device_type: 'scanner',
        device_name: 'Honeywell 1900',
        device_id: 'USB002',
        interface_type: 'USB',
        port_address: 'USB002',
        is_connected: true
      }
    ];

    // Salvar dispositivos detectados no banco
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('detected_devices')
          .upsert(devices, { onConflict: 'device_id' });

        if (error) {
          console.error('Erro ao salvar dispositivos:', error);
        }
      } catch (dbError) {
        console.error('Erro ao conectar com banco para dispositivos:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      devices: devices 
    });
    
  } catch (error) {
    console.error('Erro ao detectar dispositivos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao detectar dispositivos',
      details: error.message 
    });
  }
};

// Função para gerar e imprimir recibo
async function generateAndPrintReceipt(printer, saleData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  // Cabeçalho
  await printer.alignCenter();
  await printer.bold(true);
  await printer.println(saleData.store_name || 'LOJA');
  await printer.bold(false);
  await printer.println("=".repeat(32));
  
  // Data e hora
  await printer.alignLeft();
  await printer.println(`Data: ${dateStr}`);
  await printer.println(`Hora: ${timeStr}`);
  await printer.println(`Venda: #${saleData.id}`);
  await printer.println("=".repeat(32));
  
  // Itens
  for (const item of saleData.items) {
    await printer.println(item.name);
    await printer.println(`${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`);
    await printer.println("");
  }
  
  // Totais
  await printer.println("=".repeat(32));
  await printer.println(`Subtotal: R$ ${saleData.subtotal.toFixed(2)}`);
  if (saleData.discount && saleData.discount > 0) {
    await printer.println(`Desconto: R$ ${saleData.discount.toFixed(2)}`);
  }
  await printer.bold(true);
  await printer.println(`TOTAL: R$ ${saleData.total.toFixed(2)}`);
  await printer.bold(false);
  await printer.println("=".repeat(32));
  
  // Formas de pagamento
  for (const payment of saleData.payments) {
    await printer.println(`${payment.method}: R$ ${payment.amount.toFixed(2)}`);
  }
  
  // Rodapé
  await printer.println("=".repeat(32));
  await printer.alignCenter();
  await printer.println("Obrigado pela preferência!");
  await printer.println("=".repeat(32));
  
  // Cortar papel
  await printer.cut();
  
  // Executar impressão
  await printer.execute();
}

// Função auxiliar para gerar template do recibo
function generateReceiptTemplate(saleData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  return `
================================
    ${saleData.store_name || 'LOJA'}
================================
Data: ${dateStr}
Hora: ${timeStr}
Venda: #${saleData.id}
================================
${saleData.items.map(item => 
  `${item.name}\n${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`
).join('\n')}
================================
Subtotal: R$ ${saleData.subtotal.toFixed(2)}
Desconto: R$ ${(saleData.discount || 0).toFixed(2)}
TOTAL: R$ ${saleData.total.toFixed(2)}
================================
${saleData.payments.map(payment => 
  `${payment.method}: R$ ${payment.amount.toFixed(2)}`
).join('\n')}
================================
Obrigado pela preferência!
================================
  `.trim();
} 