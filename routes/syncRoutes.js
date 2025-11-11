import express from 'express';
import Auth from '../middleware/Auth.js';
import { runSync as runOpenFinanceSyncOnce } from '../jobs/syncOpenFinanceJob.js';

const router = express.Router();

// Endpoint protegido para disparo manual da sincronização
router.post('/sync', Auth.Authorization, async (req, res) => {
  try {
    const result = await runOpenFinanceSyncOnce();
    return res.status(200).json({ message: 'Sincronização executada', result });
  } catch (error) {
    console.error('[POST /sync] Erro ao executar sincronização:', error.message);
    return res.status(500).json({ error: 'Falha ao executar sincronização', details: error.message });
  }
});

export default router;