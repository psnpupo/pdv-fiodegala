exports.getStatus = (req, res) => {
  res.json({
    backend: 'ok',
    integration: 'pending',
    timestamp: new Date().toISOString()
  });
};
