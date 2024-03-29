const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const math = require("mathjs");
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

const sessions = {};

function solveEquation(equation) {
  return eval(equation);
}

app.post("/api/v1/create-session", (req, res) => {
  const sessionId = generateSessionId();
  sessions[sessionId] = [];
  res.json({ sessionId });
});

app.delete("/api/v1/delete-session/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  if (sessions[sessionId]) {
    while (sessions[sessionId]) {
      delete sessions[sessionId];
    }
    res.json({ message: "Session deleted successfully" });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

app.delete("/api/v1/delete-file/:sessionId/:fileName", (req, res) => {
  const sessionId = req.params.sessionId;
  const fileName = req.params.fileName;
  const files = sessions[sessionId];
  if (!files) {
    return res.status(404).json({ error: "Session not found" });
  }
  const index = files.findIndex((file) => file.name === fileName);
  if (index !== -1) {
    const deletedFile = files.splice(index, 1);
    res.json({
      message: `File '${fileName}' deleted from session`,
      deletedFile,
    });
  } else {
    res.status(404).json({ error: "File not found in session" });
  }
});

const fs = require("fs");

app.post(
  "/api/v1/upload-file/:sessionId",
  upload.array("files", 15),
  (req, res) => {
    const sessionId = req.params.sessionId;
    const files = sessions[sessionId] || [];
    if (!files) {
      return res.status(404).json({ error: "Session not found" });
    }
    const uploadedFiles = req.files;
    for (const uploadedFile of uploadedFiles) {
      if (files.length >= 15) {
        files.shift();
      }
      const fileContents = fs.readFileSync(uploadedFile.path, "utf8");
      const result = math.evaluate(fileContents);
      files.push({ name: uploadedFile.originalname, result });
    }
    const totalResult = files.reduce((acc, cur) => acc + cur.result, 0);
    res.json({ files, totalResult });
  }
);

function solveEquation(fileContent) {}

function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
