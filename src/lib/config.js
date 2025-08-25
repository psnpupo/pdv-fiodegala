// Configuração dinâmica do backend
const getBackendUrl = () => {
  // Se estamos em desenvolvimento local (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }
  
  // Se estamos na VPS ou produção, usar a URL relativa
  // Isso funciona para qualquer domínio/IP, incluindo:
  // - fiodegalasystem.com.br
  // - 31.97.86.88
  // - Qualquer outro domínio/IP da VPS
  return '/api';
};

export const BACKEND_URL = getBackendUrl();

// Log para debug
console.log('🔧 Configuração do backend:', {
  hostname: window.location.hostname,
  backendUrl: BACKEND_URL,
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  vpsInfo: {
    domain: 'fiodegalasystem.com.br',
    ip: '31.97.86.88',
    currentHostname: window.location.hostname
  }
});
