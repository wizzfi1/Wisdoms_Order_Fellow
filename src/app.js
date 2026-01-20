require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("My Order Fellow API running");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
