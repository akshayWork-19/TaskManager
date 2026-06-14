const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db');
const AppError = require('../utils/AppError');

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('An account with this email already exists', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
};

module.exports = { register, login };
