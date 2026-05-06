const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

let todos = [];
let nextId = 1;

app.use(express.json());

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${durationMs.toFixed(2)}`
    );
  });

  next();
});

app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/todos', (req, res) => {
  res.json({ todos });
});

app.post('/todos', (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const todo = {
    id: nextId,
    text,
    done: false
  };

  nextId += 1;
  todos.push(todo);

  return res.status(201).json(todo);
});

app.delete('/todos/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Todo id must be a number' });
  }

  todos = todos.filter((todo) => todo.id !== id);

  return res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Todo app listening on port ${port}`);
});
