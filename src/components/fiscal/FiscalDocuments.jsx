import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Send, Download, Eye, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import fiscalService from '@/lib/fiscalService';

const FiscalDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    document_type: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await fiscalService.getDocuments(filters);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro ao carregar documentos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendDocument = async (documentId, documentType) => {
    try {
      await fiscalService.sendDocument(documentId, documentType);
      toast({
        title: "Documento enviado",
        description: "Documento fiscal enviado com sucesso!",
      });
      loadDocuments(); // Recarregar lista
    } catch (error) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      pending: 'Pendente',
      sent: 'Enviado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado'
    };

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type) => {
    const typeLabels = {
      nfe: 'NF-e',
      sat: 'SAT',
      nfce: 'NFC-e'
    };
    return typeLabels[type] || type.toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadDocuments();
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
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Documentos Fiscais</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="sent">Enviado</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.document_type}
                onChange={(e) => handleFilterChange('document_type', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="nfe">NF-e</option>
                <option value="sat">SAT</option>
                <option value="nfce">NFC-e</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button onClick={loadDocuments} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum documento fiscal encontrado</p>
              <p className="text-sm text-gray-400 mt-2">
                Os documentos fiscais aparecerão aqui após serem gerados no POS
              </p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <h3 className="font-semibold">
                        {getDocumentTypeLabel(doc.document_type)} #{doc.document_number}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Venda #{doc.sale_id} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Chave de Acesso</p>
                    <p className="font-mono text-sm">{doc.access_key}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-sm">{doc.error_message || 'Sem erros'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {doc.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendDocument(doc.id, doc.document_type)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download XML
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FiscalDocuments; 