// Serviço para gerenciar sistema fiscal
class FiscalService {
  constructor() {
    this.baseUrl = '/api/fiscal';
  }

  // Obter configurações fiscais
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
        throw new Error(data.error || 'Erro ao obter configurações fiscais');
      }

      return data.config;
    } catch (error) {
      console.error('Erro ao obter configurações fiscais:', error);
      throw error;
    }
  }

  // Salvar configurações fiscais
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
        throw new Error(data.error || 'Erro ao salvar configurações fiscais');
      }

      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações fiscais:', error);
      throw error;
    }
  }

  // Gerar NF-e
  async generateNFe(saleData, fiscalConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleData, fiscalConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar NF-e');
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar NF-e:', error);
      throw error;
    }
  }

  // Gerar SAT
  async generateSAT(saleData, fiscalConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-sat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleData, fiscalConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar SAT');
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar SAT:', error);
      throw error;
    }
  }

  // Enviar documento fiscal
  async sendDocument(documentId, documentType) {
    try {
      const response = await fetch(`${this.baseUrl}/send-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId, documentType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar documento fiscal');
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar documento fiscal:', error);
      throw error;
    }
  }

  // Obter documentos fiscais
  async getDocuments(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`${this.baseUrl}/documents?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter documentos fiscais');
      }

      return data.documents;
    } catch (error) {
      console.error('Erro ao obter documentos fiscais:', error);
      throw error;
    }
  }

  // Gerar documento fiscal automaticamente baseado na configuração
  async generateFiscalDocument(saleData) {
    try {
      const config = await this.getConfig();
      
      if (config.nfe.enabled) {
        return await this.generateNFe(saleData, config);
      } else if (config.sat.enabled) {
        return await this.generateSAT(saleData, config);
      } else {
        throw new Error('Nenhum sistema fiscal habilitado');
      }
    } catch (error) {
      console.error('Erro ao gerar documento fiscal:', error);
      throw error;
    }
  }

  // Validar CNPJ
  validateCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) {
      return false;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) {
      return false;
    }
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    
    if (parseInt(cnpj.charAt(12)) !== digito) {
      return false;
    }
    
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    
    return parseInt(cnpj.charAt(13)) === digito;
  }

  // Formatar CNPJ
  formatCNPJ(cnpj) {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

// Exportar instância única
export const fiscalService = new FiscalService();
export default fiscalService; 