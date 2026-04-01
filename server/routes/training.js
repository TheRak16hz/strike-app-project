const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Base routes: /api/training

// Exercise Library
router.get('/library', trainingController.getExerciseLibrary);
router.post('/library', trainingController.createExercise);
router.put('/library/:id', trainingController.updateExercise);
router.delete('/library/:id', trainingController.deleteExercise);

// Routines
router.get('/routines', trainingController.getRoutines);
router.post('/routines', trainingController.createRoutine);
router.delete('/routines/:id', trainingController.deleteRoutine);

// Workout Logs
router.get('/logs', trainingController.getLogs);
router.post('/logs', trainingController.logWorkout);

module.exports = router;
