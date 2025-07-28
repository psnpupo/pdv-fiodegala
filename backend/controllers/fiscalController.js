const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase conectado para sistema fiscal');
  }
} catch (error) {
  console.log('❌ Supabase não configurado para sistema fiscal:', error.message);
}

// Obter configurações fiscais
exports.getFiscalConfig = async (req, res) => {
  try {
    let config = {
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
    };

    // Carregar do banco de dados
    if (supabase) {
      try {
        const { data: configs, error } = await supabase
          .from('fiscal_configs')
          .select('config_type, config_data')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && configs) {
          configs.forEach(item => {
            if (item.config_type === 'nfe') {
              config.nfe = { ...config.nfe, ...item.config_data };
            } else if (item.config_type === 'sat') {
              config.sat = { ...config.sat, ...item.config_data };
            } else if (item.config_type === 'general') {
              config.general = { ...config.general, ...item.config_data };
            }
          });
        }
      } catch (dbError) {
        console.error('Erro ao carregar configurações fiscais:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      config: config 
    });
    
  } catch (error) {
    console.error('Erro ao obter configurações fiscais:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter configurações fiscais',
      details: error.message 
    });
  }
};

// Salvar configurações fiscais
exports.saveFiscalConfig = async (req, res) => {
  try {
    const { config } = req.body;
    
    console.log('Salvando configurações fiscais:', config);
    
    // Salvar no banco de dados
    if (supabase) {
      try {
        // Desativar configurações antigas
        await supabase
          .from('fiscal_configs')
          .update({ is_active: false })
          .eq('is_active', true);

        // Inserir novas configurações
        const configsToInsert = [
          { config_type: 'nfe', config_data: config.nfe },
          { config_type: 'sat', config_data: config.sat },
          { config_type: 'general', config_data: config.general }
        ];

        const { data, error } = await supabase
          .from('fiscal_configs')
          .insert(configsToInsert);

        if (error) {
          console.error('Erro ao salvar no banco:', error);
          throw new Error('Erro ao salvar no banco de dados');
        }

        console.log('✅ Configurações fiscais salvas no banco:', data);
      } catch (dbError) {
        console.error('Erro ao conectar com banco:', dbError);
        throw new Error('Erro de conexão com banco de dados');
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Configurações fiscais salvas com sucesso',
      config: config 
    });
    
  } catch (error) {
    console.error('Erro ao salvar configurações fiscais:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao salvar configurações fiscais',
      details: error.message 
    });
  }
};

// Gerar NF-e
exports.generateNFe = async (req, res) => {
  try {
    const { saleData, fiscalConfig } = req.body;
    
    console.log('Gerando NF-e para venda:', saleData.id);
    
    // Simular geração de NF-e
    const nfeData = {
      documentNumber: generateDocumentNumber(fiscalConfig.nfe.nextNumber),
      accessKey: generateAccessKey(),
      xmlContent: generateNFeXML(saleData, fiscalConfig),
      status: 'pending'
    };
    
    // Salvar documento fiscal no banco
    if (supabase) {
      try {
        const { data: docData, error } = await supabase
          .from('fiscal_documents')
          .insert({
            store_id: saleData.store_id,
            sale_id: saleData.id,
            document_type: 'nfe',
            document_number: nfeData.documentNumber,
            access_key: nfeData.accessKey,
            status: nfeData.status,
            xml_content: nfeData.xmlContent
          });

        if (error) {
          console.error('Erro ao salvar documento fiscal:', error);
        } else {
          console.log('✅ Documento fiscal salvo:', docData);
        }
      } catch (dbError) {
        console.error('Erro ao conectar com banco para documento fiscal:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'NF-e gerada com sucesso',
      nfe: nfeData 
    });
    
  } catch (error) {
    console.error('Erro ao gerar NF-e:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar NF-e',
      details: error.message 
    });
  }
};

// Gerar SAT
exports.generateSAT = async (req, res) => {
  try {
    const { saleData, fiscalConfig } = req.body;
    
    console.log('Gerando SAT para venda:', saleData.id);
    
    // Simular geração de SAT
    const satData = {
      documentNumber: generateDocumentNumber(fiscalConfig.sat.nextNumber),
      accessKey: generateAccessKey(),
      xmlContent: generateSATXML(saleData, fiscalConfig),
      status: 'pending'
    };
    
    // Salvar documento fiscal no banco
    if (supabase) {
      try {
        const { data: docData, error } = await supabase
          .from('fiscal_documents')
          .insert({
            store_id: saleData.store_id,
            sale_id: saleData.id,
            document_type: 'sat',
            document_number: satData.documentNumber,
            access_key: satData.accessKey,
            status: satData.status,
            xml_content: satData.xmlContent
          });

        if (error) {
          console.error('Erro ao salvar documento fiscal:', error);
        } else {
          console.log('✅ Documento fiscal salvo:', docData);
        }
      } catch (dbError) {
        console.error('Erro ao conectar com banco para documento fiscal:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'SAT gerado com sucesso',
      sat: satData 
    });
    
  } catch (error) {
    console.error('Erro ao gerar SAT:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar SAT',
      details: error.message 
    });
  }
};

// Enviar documento fiscal
exports.sendFiscalDocument = async (req, res) => {
  try {
    const { documentId, documentType } = req.body;
    
    console.log(`Enviando documento fiscal ${documentType}:`, documentId);
    
    // Simular envio para SEFAZ
    const result = {
      success: true,
      status: 'approved',
      protocol: generateProtocol(),
      message: 'Documento enviado com sucesso'
    };
    
    // Atualizar status no banco
    if (supabase) {
      try {
        await supabase
          .from('fiscal_documents')
          .update({
            status: result.status,
            response_data: result
          })
          .eq('id', documentId);

        // Salvar log
        await supabase
          .from('fiscal_logs')
          .insert({
            action: `send_${documentType}`,
            document_id: documentId,
            details: result,
            status: 'success'
          });
      } catch (dbError) {
        console.error('Erro ao atualizar documento fiscal:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Documento enviado com sucesso',
      result: result 
    });
    
  } catch (error) {
    console.error('Erro ao enviar documento fiscal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao enviar documento fiscal',
      details: error.message 
    });
  }
};

// Obter documentos fiscais
exports.getFiscalDocuments = async (req, res) => {
  try {
    const { store_id, status, document_type } = req.query;
    
    let query = supabase
      .from('fiscal_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (store_id) query = query.eq('store_id', store_id);
    if (status) query = query.eq('status', status);
    if (document_type) query = query.eq('document_type', document_type);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error('Erro ao buscar documentos fiscais');
    }
    
    res.json({ 
      success: true, 
      documents: data 
    });
    
  } catch (error) {
    console.error('Erro ao obter documentos fiscais:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter documentos fiscais',
      details: error.message 
    });
  }
};

// Funções auxiliares
function generateDocumentNumber(nextNumber) {
  return nextNumber.toString().padStart(9, '0');
}

function generateAccessKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateProtocol() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateNFeXML(saleData, fiscalConfig) {
  const now = new Date();
  const dateStr = now.toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${generateAccessKey()}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${generateDocumentNumber(fiscalConfig.nfe.nextNumber)}</cNF>
        <natOp>Venda de mercadoria</natOp>
        <mod>55</mod>
        <serie>${fiscalConfig.nfe.series}</serie>
        <nNF>${generateDocumentNumber(fiscalConfig.nfe.nextNumber)}</nNF>
        <dhEmi>${dateStr}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>1</cDV>
        <tpAmb>${fiscalConfig.nfe.environment === 'production' ? '2' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>PDV Fio de Gala</verProc>
      </ide>
      <emit>
        <CNPJ>${fiscalConfig.general.cnpj}</CNPJ>
        <xNome>${fiscalConfig.general.razaoSocial}</xNome>
        <xFant>${fiscalConfig.general.nomeFantasia}</xFant>
        <enderEmit>
          <xLgr>Endereço da Empresa</xLgr>
          <nro>123</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01234-567</CEP>
        </enderEmit>
        <IE>${fiscalConfig.general.inscricaoEstadual}</IE>
        <CRT>1</CRT>
      </emit>
      <total>
        <ICMSTot>
          <vBC>${saleData.subtotal.toFixed(2)}</vBC>
          <vICMS>0.00</vICMS>
          <vProd>${saleData.subtotal.toFixed(2)}</vProd>
          <vNF>${saleData.total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
}

function generateSATXML(saleData, fiscalConfig) {
  const now = new Date();
  const dateStr = now.toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<CFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infCFe Id="CFe${generateAccessKey()}" versaoDadosEnt="0.07">
    <ide>
      <CNPJ>${fiscalConfig.general.cnpj}</CNPJ>
      <signAC>SGR-SAT SISTEMA DE GESTAO E RETAGUARDA DO SAT</signAC>
      <numeroCaixa>001</numeroCaixa>
    </ide>
    <total>
      <vCFe>${saleData.total.toFixed(2)}</vCFe>
    </total>
  </infCFe>
</CFe>`;
} 