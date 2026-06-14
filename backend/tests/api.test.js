const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

describe('API Tests', () => {
  let token = '';

  beforeAll(async () => {
    // Clear test user
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should block unauthorized access to tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toEqual(401);
  });

  it('should create a task when authenticated', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        priority: 'high'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('title', 'Test Task');
    expect(res.body).toHaveProperty('priority', 'high');
  });
});
