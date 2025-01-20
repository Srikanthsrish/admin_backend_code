const express = require("express");
const connection = require("./mysql.js"); // Adjust the path to your mysql.js
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Allowed Origins for CORS
app.use(
    cors({
      origin: "*", // Allow all origins temporarily
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
  

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Admin Login Endpoint
app.post("/api/admin/login", (req, res) => {
  const { admin_id, emailid, password } = req.body;

  if (!admin_id || !emailid || !password) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }

  const query = `
    SELECT * FROM admin
    WHERE admin_id = ? AND emailid = ? AND password = ? LIMIT 1
  `;

  connection.query(query, [admin_id, emailid, password], (err, results) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ error: "Server error. Please try again later." });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid admin ID, email, or password." });
    }

    res.status(200).json({ message: "Login successful." });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
