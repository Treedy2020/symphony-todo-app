const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dataDir = path.join(__dirname, 'data');
const todosFile = path.join(dataDir, 'todos.json');

let todos = [];
let nextId = 1;

function loadTodos() {
  try {
    if (!fs.existsSync(todosFile)) {
      return [];
    }

    const fileContents = fs.readFileSync(todosFile, 'utf8');
    const parsedTodos = JSON.parse(fileContents);

    if (!Array.isArray(parsedTodos)) {
      console.error(`${todosFile} must contain a JSON array. Starting with an empty todo list.`);
      return [];
    }

    return parsedTodos;
  } catch (error) {
    console.error('Failed to load todos:', error);
    return [];
  }
}

function persistTodos() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(todosFile, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to persist todos:', error);
  }
}

todos = loadTodos();
nextId = todos.reduce((maxId, todo) => {
  return Number.isInteger(todo.id) && todo.id >= maxId ? todo.id + 1 : maxId;
}, 1);

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
  persistTodos();

  return res.status(201).json(todo);
});

app.delete('/todos/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Todo id must be a number' });
  }

  todos = todos.filter((todo) => todo.id !== id);
  persistTodos();

  return res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Todo app listening on port ${port}`);
});
