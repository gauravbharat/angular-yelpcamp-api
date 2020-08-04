const express = require("express");
const app = express();

// Middleware
app.use((req, res, next) => {
  next();
});

app.use((req, res) => {
  res.send("SETUP PENDING...");
});

module.exports = app;
