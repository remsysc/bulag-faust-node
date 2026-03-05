const express = require("express");

const app = express();

//parse incoming json bodies
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port  ${PORT}`);
});
