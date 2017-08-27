const express = require('express');

const todoItems = ['Teach myself some Erlang', 'Go to the aquarium'];

const getDbConnection = () => {
  const conn = {
    lastQuery: null,
    logEntries: [],
    fetchTodoItems: () => {
      this.lastQuery = Date.now();
      return this.log(new Promise(resolve => resolve(todoItems)));
    },
    log(p) {
      this.logEntries.push(p);
      return p;
    },
    release: () => {
      this.logEntries = [];
    },
  };
  setInterval(() => {
    if (conn.lastQuery < Date.now() - 300000) {
      conn.release();
    }
  });
};

const app = express().get('/todo-items', async (req, res) => {
  const db = await getDbConnection();
  const items = await db.fetchTodoItems();
  res.json(items);
});

app.listen(8080);
