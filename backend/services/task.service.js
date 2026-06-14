const { z } = require('zod');
const prisma = require('../db');
const AppError = require('../utils/AppError');

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  status: z.enum(['pending', 'in_progress', 'completed'], {
    errorMap: () => ({ message: 'Status must be pending, in_progress, or completed' }),
  }).optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
  }).optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format' }).optional().nullable(),
});

const updateTaskSchema = taskSchema.partial();

// Helper to check admin or ownership
const resolveTaskWhere = (taskId, userId, role) =>
  role === 'admin' ? { id: taskId } : { id: taskId, userId };

// Writes an entry to the activity log
const logActivity = (taskId, action) =>
  prisma.activityLog.create({ data: { taskId, action } });

/**
 * GET /api/tasks
 */
const listTasks = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError('User not found', 404);

    const {
      status, search,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = 1, limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = user.role === 'admin' ? {} : { userId: req.userId };
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [safeSortBy]: safeSortOrder },
        skip,
        take: limitNum,
        include: { user: { select: { email: true } } },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      isAdmin: user.role === 'admin',
      pagination: {
        total, page: pageNum, limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 */
const getTask = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError('User not found', 404);

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!task) throw new AppError('Task not found', 404);
    if (user.role !== 'admin' && task.userId !== req.userId) {
      throw new AppError('You do not have permission to view this task', 403);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({ data: { ...data, userId: req.userId } });
    await logActivity(task.id, 'Task created');
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
};

/**
 * PATCH /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError('User not found', 404);

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new AppError('Task not found', 404);
    if (user.role !== 'admin' && task.userId !== req.userId) {
      throw new AppError('You do not have permission to update this task', 403);
    }

    const updatedTask = await prisma.task.update({ where: { id: req.params.id }, data });

    const changes = Object.entries(data)
      .map(([key, val]) => `${key} → ${val}`)
      .join(', ');
    await logActivity(task.id, `Updated: ${changes}`);

    res.json(updatedTask);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
};

/**
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError('User not found', 404);

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new AppError('Task not found', 404);
    if (user.role !== 'admin' && task.userId !== req.userId) {
      throw new AppError('You do not have permission to delete this task', 403);
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
