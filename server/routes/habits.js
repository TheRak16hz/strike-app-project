const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/authMiddleware');

// Protegemos todas las rutas de este router
router.use(authMiddleware);

// Rutas base: /api/habits
router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/toggle', habitController.toggleHabit);

module.exports = router;
