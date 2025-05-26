const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();

app.use(express.json());
app.use(cors());

// Ma'lumotlarni data.json faylidan o'qish va yozish
const DATA_FILE = './data.json';

const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], classes: [], grades: [] };
  }
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

// Boshlang'ich ma'lumotlarni yaratish
const initData = async () => {
  const data = await readData();
  if (!data.users || data.users.length === 0) {
    console.log('Admin foydalanuvchisini yaratish...');
    const adminUser = { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin' };
    data.users = [adminUser];
    console.log('Admin yaratildi:', adminUser);
  }
  if (!data.classes) data.classes = [];
  if (!data.grades) data.grades = [];
  await writeData(data);
};

// Users endpoint'lari
app.get('/users', async (req, res) => {
  const data = await readData();
  res.json(data.users || []);
});

app.post('/users', async (req, res) => {
  const user = req.body;
  const data = await readData();
  user.id = (data.users || []).length + 1;
  data.users = [...(data.users || []), user];
  await writeData(data);
  res.json(user);
});

app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const updatedUser = req.body;
  const data = await readData();
  data.users = data.users.map(u => u.id === id ? { ...u, ...updatedUser } : u);
  await writeData(data);
  res.json(updatedUser);
});

app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = await readData();
  data.users = data.users.filter(u => u.id !== id);
  await writeData(data);
  res.json({ message: 'User deleted' });
});

// Classes endpoint'lari
app.get('/classes', async (req, res) => {
  const data = await readData();
  res.json(data.classes || []);
});

app.post('/classes', async (req, res) => {
  const cls = req.body;
  const data = await readData();
  cls.id = (data.classes || []).length + 1;
  data.classes = [...(data.classes || []), cls];
  await writeData(data);
  res.json(cls);
});

app.delete('/classes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = await readData();
  const deletedClass = data.classes.find(c => c.id === id)?.name;
  data.classes = data.classes.filter(c => c.id !== id);
  data.users.forEach(u => {
    if (u.role === 'student' && u.class === deletedClass) u.class = '';
  });
  await writeData(data);
  res.json({ message: 'Class deleted' });
});

// Grades endpoint'lari
app.get('/grades', async (req, res) => {
  const data = await readData();
  res.json(data.grades || []);
});

app.post('/grades', async (req, res) => {
  const grade = req.body;
  const data = await readData();
  data.grades = [...(data.grades || []), grade];
  await writeData(data);
  res.json(grade);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
  initData();
});
