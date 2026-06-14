const express = require('express');
const authMiddleware = require('../middleware/auth');
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../services/task.service');

const router = express.Router();
router.use(authMiddleware);

router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
