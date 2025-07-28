// Serviço para gerenciar periféricos
class PeripheralsService {
  constructor() {
    this.baseUrl = '/api/peripherals';
  }

  // Testar impressora
  async testPrinter(printerConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/test-printer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao testar impressora');
      }

      return data;
    } catch (error) {
      console.error('Erro no teste da impressora:', error);
      throw error;
    }
  }

  // Testar scanner
  async testScanner(scannerConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/test-scanner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scannerConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao testar scanner');
      }

      return data;
    } catch (error) {
      console.error('Erro no teste do scanner:', error);
      throw error;
    }
  }

  // Ler código de barras
  async scanBarcode(scannerConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/scan-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scannerConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ler código de barras');
      }

      return data;
    } catch (error) {
      console.error('Erro na leitura do código de barras:', error);
      throw error;
    }
  }

  // Imprimir recibo
  async printReceipt(saleData, printerConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/print-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleData, printerConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao imprimir recibo');
      }

      return data;
    } catch (error) {
      console.error('Erro na impressão:', error);
      throw error;
    }
  }

  // Obter configurações de periféricos
  async getConfig() {
    try {
      const response = await fetch(`${this.baseUrl}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter configurações');
      }

      return data.config;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  // Salvar configurações de periféricos
  async saveConfig(config) {
    try {
      const response = await fetch(`${this.baseUrl}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações');
      }

      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  // Detectar dispositivos
  async detectDevices() {
    try {
      const response = await fetch(`${this.baseUrl}/detect-devices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao detectar dispositivos');
      }

      return data.devices;
    } catch (error) {
      console.error('Erro ao detectar dispositivos:', error);
      throw error;
    }
  }

  // Gerar recibo em formato texto (para preview)
  generateReceiptPreview(saleData) {
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
}

// Exportar instância única
export const peripheralsService = new PeripheralsService();
export default peripheralsService; 