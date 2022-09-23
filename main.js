const express = require("express");
const app = express();
const port = 3030;
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.patch("/api/strings", (req, res) => {
  const { strings = [] } = req.body;
  if (strings.length === 0) {
    res.status(400);
  } else res.status(200).json({ CamelCase: a });
});

app.listen(port, () => {
  console.log(`À escuta em http://localhost:${port}`);
});
