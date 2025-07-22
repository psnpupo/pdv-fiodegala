const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Obter estado atual do caixa
exports.getCashRegisterState = async (req, res) => {
  try {
    const { store_id } = req.query;

    let query = supabase
      .from('cash_register_logs')
      .select('*, stores(name, is_online_store)')
      .order('created_at', { ascending: false });

    // Filtrar por loja se especificado
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    const { data: logs, error } = await query.limit(10);

    if (error) {
      console.error('Erro ao buscar estado do caixa:', error);
      return res.status(500).json({ error: 'Erro ao buscar estado do caixa.' });
    }

    if (!logs || logs.length === 0) {
      return res.json({
        isOpen: false,
        openingAmount: 0,
        currentAmount: 0,
        openedBy: null,
        openedAt: null,
        closedAt: null,
        id: null,
        store_id: store_id,
        store: null
      });
    }

    const lastLog = logs[0];
    const isOpen = lastLog.type === 'open';

    res.json({
      id: lastLog.id,
      isOpen: isOpen,
      openingAmount: isOpen ? lastLog.initial_amount : 0,
      currentAmount: lastLog.current_amount,
      openedBy: isOpen ? lastLog.user_id : null,
      openedAt: isOpen ? lastLog.created_at : null,
      closedAt: !isOpen ? lastLog.created_at : null,
      store_id: lastLog.store_id,
      store: lastLog.stores
    });

  } catch (err) {
    console.error('Erro ao buscar estado do caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Abrir caixa
exports.openCashRegister = async (req, res) => {
  try {
    const { initial_amount, store_id, user_id } = req.body;

    if (!initial_amount || initial_amount < 0) {
      return res.status(400).json({ error: 'Valor inicial é obrigatório e deve ser maior ou igual a zero.' });
    }

    if (!store_id) {
      return res.status(400).json({ error: 'ID da loja é obrigatório.' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Verificar se o usuário existe no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError || !authUser.user) {
      return res.status(400).json({ error: 'Usuário não encontrado no sistema.' });
    }

    // Verificar se já existe um caixa aberto para esta loja
    const { data: existingLogs, error: checkError } = await supabase
      .from('cash_register_logs')
      .select('id, type, created_at')
      .eq('store_id', store_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (checkError) {
      console.error('Erro ao verificar caixa existente:', checkError);
      return res.status(500).json({ error: 'Erro ao verificar caixa existente.' });
    }

    // Verificar se o último registro é de abertura (não fechado)
    if (existingLogs && existingLogs.length > 0) {
      const lastLog = existingLogs[0];
      if (lastLog.type === 'open') {
        return res.status(400).json({ error: 'Já existe um caixa aberto para esta loja.' });
      }
    }

    // Criar log de abertura
    const { data, error } = await supabase
      .from('cash_register_logs')
      .insert([{
        type: 'open',
        initial_amount: initial_amount,
        current_amount: initial_amount,
        store_id: store_id,
        user_id: user_id,
        notes: 'Abertura de caixa'
      }])
      .select('*, stores(name, is_online_store)')
      .single();

    if (error) {
      console.error('Erro ao abrir caixa:', error);
      return res.status(500).json({ error: 'Erro ao abrir caixa.' });
    }

    res.status(201).json({
      message: 'Caixa aberto com sucesso!',
      cashRegister: {
        id: data.id,
        isOpen: true,
        openingAmount: data.initial_amount,
        currentAmount: data.current_amount,
        openedBy: data.user_id,
        openedAt: data.created_at,
        store_id: data.store_id,
        store: data.stores
      }
    });

  } catch (err) {
    console.error('Erro ao abrir caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Fechar caixa
exports.closeCashRegister = async (req, res) => {
  try {
    const { final_amount, store_id, user_id, notes } = req.body;

    if (!store_id) {
      return res.status(400).json({ error: 'ID da loja é obrigatório.' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Verificar se o usuário existe no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError || !authUser.user) {
      return res.status(400).json({ error: 'Usuário não encontrado no sistema.' });
    }

    // Buscar caixa aberto
    const { data: existingLogs, error: findError } = await supabase
      .from('cash_register_logs')
      .select('*')
      .eq('store_id', store_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (findError) {
      console.error('Erro ao buscar logs do caixa:', findError);
      return res.status(500).json({ error: 'Erro ao buscar logs do caixa.' });
    }

    // Verificar se existe um caixa aberto
    if (!existingLogs || existingLogs.length === 0) {
      return res.status(404).json({ error: 'Nenhum registro de caixa encontrado para esta loja.' });
    }

    const lastLog = existingLogs[0];
    if (lastLog.type !== 'open') {
      return res.status(404).json({ error: 'Nenhum caixa aberto encontrado para esta loja.' });
    }

    const openRegister = lastLog;

    // Criar log de fechamento
    const logData = {
      type: 'close',
      initial_amount: openRegister.initial_amount,
      current_amount: final_amount || openRegister.current_amount,
      store_id: store_id,
      user_id: user_id,
      notes: notes || 'Fechamento de caixa'
    };

    const { data, error } = await supabase
      .from('cash_register_logs')
      .insert([logData])
      .select('*, stores(name, is_online_store)')
      .single();

    if (error) {
      console.error('Erro ao fechar caixa:', error);
      return res.status(500).json({ error: 'Erro ao fechar caixa.' });
    }

    res.json({
      message: 'Caixa fechado com sucesso!',
      cashRegister: {
        id: data.id,
        isOpen: false,
        openingAmount: data.initial_amount,
        currentAmount: data.current_amount,
        closedBy: data.user_id,
        closedAt: data.created_at,
        store_id: data.store_id,
        store: data.stores
      }
    });

  } catch (err) {
    console.error('Erro ao fechar caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Listar logs do caixa
exports.getCashRegisterLogs = async (req, res) => {
  try {
    const { 
      store_id, 
      page = 1, 
      limit = 50,
      date_from,
      date_to 
    } = req.query;

    let query = supabase
      .from('cash_register_logs')
      .select('*, stores(name, is_online_store)')
      .order('created_at', { ascending: false });

    // Filtros
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs do caixa:', error);
      return res.status(500).json({ error: 'Erro ao buscar logs do caixa.' });
    }

    res.json({
      logs: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0
      }
    });

  } catch (err) {
    console.error('Erro ao buscar logs do caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Adicionar log do caixa
exports.addCashRegisterLog = async (req, res) => {
  try {
    const { type, amount, store_id, user_id, notes } = req.body;

    if (!type || !store_id) {
      return res.status(400).json({ error: 'Tipo e ID da loja são obrigatórios.' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Verificar se o usuário existe no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError || !authUser.user) {
      return res.status(400).json({ error: 'Usuário não encontrado no sistema.' });
    }

    // Buscar caixa aberto para calcular valor atual
    const { data: openRegister, error: findError } = await supabase
      .from('cash_register_logs')
      .select('current_amount')
      .eq('store_id', store_id)
      .neq('type', 'close')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentAmount = 0;
    if (openRegister) {
      currentAmount = openRegister.current_amount;
    }

    // Calcular novo valor baseado no tipo de operação
    let newAmount = currentAmount;
    if (type === 'add') {
      newAmount += amount || 0;
    } else if (type === 'remove') {
      newAmount -= amount || 0;
    } else if (type === 'adjustment') {
      newAmount = amount || 0;
    }

    // Criar log
    const logData = {
      type: type,
      initial_amount: currentAmount,
      current_amount: newAmount,
      store_id: store_id,
      user_id: user_id,
      notes: notes || `Operação: ${type}`
    };

    const { data, error } = await supabase
      .from('cash_register_logs')
      .insert([logData])
      .select('*, stores(name, is_online_store)')
      .single();

    if (error) {
      console.error('Erro ao adicionar log do caixa:', error);
      return res.status(500).json({ error: 'Erro ao adicionar log do caixa.' });
    }

    res.status(201).json({
      message: 'Log adicionado com sucesso!',
      log: data
    });

  } catch (err) {
    console.error('Erro ao adicionar log do caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Resetar caixa (apenas para testes)
exports.resetCashRegister = async (req, res) => {
  try {
    const { store_id } = req.params;

    if (!store_id) {
      return res.status(400).json({ error: 'ID da loja é obrigatório.' });
    }

    // Deletar todos os logs da loja
    const { error } = await supabase
      .from('cash_register_logs')
      .delete()
      .eq('store_id', store_id);

    if (error) {
      console.error('Erro ao resetar caixa:', error);
      return res.status(500).json({ error: 'Erro ao resetar caixa.' });
    }

    res.json({
      message: 'Caixa resetado com sucesso!',
      store_id: store_id
    });

  } catch (err) {
    console.error('Erro ao resetar caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}; 