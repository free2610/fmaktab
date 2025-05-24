const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());
app.use(cors());

// Firebase Admin SDK sozlash
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fmaktab-4f687-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// Ma'lumotlarni boshlash
const initData = async () => {
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');
  if (!snapshot.exists()) {
    console.log('Admin foydalanuvchisini yaratish...');
    const adminUser = { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin' };
    await usersRef.set([adminUser]);
    console.log('Admin yaratildi:', adminUser);
  }

  const classesRef = db.ref('classes');
  const classesSnapshot = await classesRef.once('value');
  if (!classesSnapshot.exists()) {
    await classesRef.set([]);
  }

  const gradesRef = db.ref('grades');
  const gradesSnapshot = await gradesRef.once('value');
  if (!gradesSnapshot.exists()) {
    await gradesRef.set([]);
  }
};

// Users endpoint'lari
app.get('/users', async (req, res) => {
  const snapshot = await db.ref('users').once('value');
  res.json(snapshot.val() || []);
});

app.post('/users', async (req, res) => {
  const user = req.body;
  const snapshot = await db.ref('users').once('value');
  let users = snapshot.val() || [];
  user.id = users.length + 1;
  users.push(user);
  await db.ref('users').set(users);
  res.json(user);
});

app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const updatedUser = req.body;
  const snapshot = await db.ref('users').once('value');
  let users = snapshot.val() || [];
  users = users.map(u => u.id === id ? { ...u, ...updatedUser } : u);
  await db.ref('users').set(users);
  res.json(updatedUser);
});

app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const snapshot = await db.ref('users').once('value');
  let users = snapshot.val() || [];
  users = users.filter(u => u.id !== id);
  await db.ref('users').set(users);
  res.json({ message: 'User deleted' });
});

// Classes endpoint'lari
app.get('/classes', async (req, res) => {
  const snapshot = await db.ref('classes').once('value');
  res.json(snapshot.val() || []);
});

app.post('/classes', async (req, res) => {
  const cls = req.body;
  const snapshot = await db.ref('classes').once('value');
  let classes = snapshot.val() || [];
  cls.id = classes.length + 1;
  classes.push(cls);
  await db.ref('classes').set(classes);
  res.json(cls);
});

app.delete('/classes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const snapshot = await db.ref('classes').once('value');
  let classes = snapshot.val() || [];
  const deletedClass = classes.find(c => c.id === id)?.name;
  classes = classes.filter(c => c.id !== id);
  await db.ref('classes').set(classes);

  const usersSnapshot = await db.ref('users').once('value');
  let users = usersSnapshot.val() || [];
  users.forEach(u => {
    if (u.role === 'student' && u.class === deletedClass) u.class = '';
  });
  await db.ref('users').set(users);
  res.json({ message: 'Class deleted' });
});

// Grades endpoint'lari
app.get('/grades', async (req, res) => {
  const snapshot = await db.ref('grades').once('value');
  res.json(snapshot.val() || []);
});

app.post('/grades', async (req, res) => {
  const grade = req.body;
  const snapshot = await db.ref('grades').once('value');
  let grades = snapshot.val() || [];
  grades.push(grade);
  await db.ref('grades').set(grades);
  res.json(grade);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initData();
});