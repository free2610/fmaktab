const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB ulanishi
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB ulanishi muvaffaqiyatli!'))
  .catch(err => console.error('MongoDB ulanishda xatolik:', err));

// Shemalar (Schemes)
const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  password: String,
  role: String,
  name: String,
  subject: { type: String, default: '' },
  class: { type: String, default: '' }
});

const classSchema = new mongoose.Schema({
  id: Number,
  name: String
});

const gradeSchema = new mongoose.Schema({
  studentId: Number,
  subject: String,
  date: String,
  grade: Number
});

const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);
const Grade = mongoose.model('Grade', gradeSchema);

// Boshlang'ich ma'lumotlarni yaratish
const initData = async () => {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    console.log('Admin foydalanuvchisini yaratish...');
    const adminUser = new User({ id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin' });
    await adminUser.save();
    console.log('Admin yaratildi:', adminUser);
  }

  const classCount = await Class.countDocuments();
  if (classCount === 0) {
    await Class.create([]);
  }

  const gradeCount = await Grade.countDocuments();
  if (gradeCount === 0) {
    await Grade.create([]);
  }
};

// Users endpoint'lari
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = req.body;
  const users = await User.find();
  user.id = users.length + 1;
  const newUser = new User(user);
  await newUser.save();
  res.json(newUser);
});

app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const updatedUser = req.body;
  const user = await User.findOneAndUpdate({ id }, updatedUser, { new: true });
  res.json(user);
});

app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await User.findOneAndDelete({ id });
  res.json({ message: 'User deleted' });
});

// Classes endpoint'lari
app.get('/classes', async (req, res) => {
  const classes = await Class.find();
  res.json(classes);
});

app.post('/classes', async (req, res) => {
  const cls = req.body;
  const classes = await Class.find();
  cls.id = classes.length + 1;
  const newClass = new Class(cls);
  await newClass.save();
  res.json(newClass);
});

app.delete('/classes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedClass = await Class.findOne({ id });
  await Class.findOneAndDelete({ id });

  if (deletedClass) {
    await User.updateMany({ role: 'student', class: deletedClass.name }, { $set: { class: '' } });
  }
  res.json({ message: 'Class deleted' });
});

// Grades endpoint'lari
app.get('/grades', async (req, res) => {
  const grades = await Grade.find();
  res.json(grades);
});

app.post('/grades', async (req, res) => {
  const grade = req.body;
  const newGrade = new Grade(grade);
  await newGrade.save();
  res.json(newGrade);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
  initData();
});
