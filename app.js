const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const math = require("mathjs");
const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(bodyParser.json());

// Multer configuration
const upload = multer({ dest: "uploads/" });

// Object to store session data
const sessions = {};

// Function to solve mathematical equations
function solveEquation(equation) {
  return eval(equation); // Using eval is unsafe in production, consider using a safe expression evaluator library
}

// Route to create session
app.post("/api/v1/create-session", (req, res) => {
  const sessionId = generateSessionId();
  sessions[sessionId] = [];
  res.json({ sessionId });
});

// Route to delete a session
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

// Route to delete a file from session
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

// Route to upload files and solve equations
const fs = require("fs"); // Include the file system module

app.post(
  "/api/v1/upload-file/:sessionId",
  upload.array("files", 15),
  (req, res) => {
    const sessionId = req.params.sessionId;
    const files = sessions[sessionId] || [];

    // Check if session exists
    if (!files) {
      return res.status(404).json({ error: "Session not found" });
    }

    const uploadedFiles = req.files;

    // Loop through each uploaded file
    for (const uploadedFile of uploadedFiles) {
      // Check if file limit exceeded
      if (files.length >= 15) {
        files.shift(); // Drop the first file if limit exceeded
      }

      // Read file contents and solve equation
      const fileContents = fs.readFileSync(uploadedFile.path, "utf8");
      console.log(fileContents);
      console.log(typeof fileContents);
      const result = math.evaluate(fileContents);
      files.push({ name: uploadedFile.originalname, result });
    }

    const totalResult = files.reduce((acc, cur) => acc + cur.result, 0);
    res.json({ files, totalResult });
  }
);

// Function to solve equation from file content
function solveEquation(fileContent) {
  // Logic to parse file content and solve equation goes here
}

// Generate a random session ID
function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
