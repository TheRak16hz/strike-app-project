const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

// Protegemos todas las rutas
router.use(authMiddleware);

router.get('/', financeController.getFinanceData);
router.post('/goals', financeController.createGoal);
router.put('/goals/:id', financeController.updateGoal);
router.delete('/goals/all', financeController.deleteAllGoals);
router.delete('/goals/:id', financeController.deleteGoal);
router.post('/transactions', financeController.createTransaction);
router.put('/transactions/:id', financeController.updateTransaction);
router.delete('/transactions/all', financeController.deleteAllTransactions);
router.delete('/transactions/:id', financeController.deleteTransaction);
router.post('/settings', financeController.updateSettings);

module.exports = router;
