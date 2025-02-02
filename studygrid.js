const express = require("express");
const connection = require("./mysql.js"); 
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3006;
app.use(cors());



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

    res.status(200).json({ 
      message: "Login successful.",
      admin_id: results[0].admin_id 
    });
  });
});


// API: Student Login
app.post("/api/student/login", (req, res) => {
  const { fullName, class: studentClass, password } = req.body;

  // Check if all fields are provided
  if (!fullName || !studentClass || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Query to validate user credentials
  const query = "SELECT * FROM students WHERE fullName = ? AND class = ? AND password = ?";
  connection.query(query, [fullName, studentClass, password], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }

    if (results.length === 0) {
      // Invalid credentials
      return res.status(401).json({ message: "Invalid credentials. Please try again." });
    }

    // Login successful
    const student = results[0];
    res.status(200).json({
      fullName: student.fullName,
      class: student.class,
      message: "Login successful!",
    });
  });
})

// Teacher Login API
app.post("/api/teacher/login", (req, res) => {
  const { teacherId, email, password } = req.body;

  // Validate request body
  if (!teacherId || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  // Query to validate teacher credentials
  const query = "SELECT * FROM teachers WHERE teacherId = ? AND email = ? AND password = ?";
  connection.query(query, [teacherId, email, password], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }

    if (results.length === 0) {
      // Invalid credentials
      return res.status(401).json({ success: false, message: "Invalid credentials. Please try again." });
    }

    // Login successful
    const teacher = results[0];
    res.status(200).json({
      success: true,
      message: "Login successful!",
      teacherId:teacher.teacherId,
      name: teacher.name,
      email: teacher.email,
    });
  });
});
// students-profile
app.get("/students/profile", (req, res) => {
  const { fullName } = req.query;

  // Query the database for the student by fullName
  const query = "SELECT * FROM students WHERE fullName = ?";
  
  connection.query(query, [fullName], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ message: "Database query error" });
    }

    if (results.length > 0) {
      res.json(results[0]); // Return the first student found
    } else {
      res.status(404).json({ message: "Profile not found" }); // Handle case when student is not found
    }
  });
});

// Endpoint to submit a new complaint for a specific student (using fullName)
app.post("/students/submit-complaint", (req, res) => {
  const { fullName, description } = req.body;

  if (!fullName || !description) {
    return res.status(400).json({ message: "Full name and description are required." });
  }

  const query = "INSERT INTO students_complaints (fullName, description) VALUES (?, ?)";

  connection.query(query, [fullName, description], (err, result) => {
    if (err) {
      console.error("Error submitting complaint:", err);
      return res.status(500).json({ message: "Error submitting complaint." });
    }

    res.status(201).json({
      message: "Complaint submitted successfully!",
      id: result.insertId,
      fullName,
      description,
      status: "Pending",
    });
  });
});

// Endpoint to get all complaints for a specific student (using fullName)
app.get("/students/complaints", (req, res) => {
  const { fullName } = req.query;

  if (!fullName) {
    return res.status(400).json({ message: "Full name is required to fetch complaints." });
  }

  // Sanitize and ensure fullName is passed correctly
  const query = "SELECT * FROM students_complaints WHERE fullName = ? ORDER BY createdAt DESC";
  
  connection.query(query, [fullName], (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.status(500).json({ message: "Error fetching complaints." });
    }

    if (results.length > 0) {
      return res.json(results); // Return the list of complaints for the student
    } else {
      return res.status(404).json({ message: "No complaints found for this student." });
    }
  });
});
app.get("/admin/profile", (req, res) => {
  let { admin_id } = req.query; // Extract admin_id from query parameters

  // Validate and parse admin_id
  if (!admin_id) {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  admin_id = parseInt(admin_id.trim(), 10); // Parse admin_id as an integer

  if (isNaN(admin_id)) {
    return res.status(400).json({ message: "Invalid Admin ID" });
  }

  

  // SQL query to fetch admin data
  const query = "SELECT * FROM admin WHERE admin_id = ?";

  // Execute the query
  connection.query(query, [admin_id], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ message: "Database query error" });
    }

    if (results.length > 0) {
      res.json(results[0]); // Return the first admin found
    } else {
      res.status(404).json({ message: "Admin profile not found"})
    }
  })
})



// Backend: Express API for Teacher Profile
app.get('/api/teacher/profile/:teacherId', (req, res) => {
  const { teacherId } = req.params;

  const query = "SELECT teacherId, name, email FROM teachers WHERE teacherId = ?";

  connection.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error("Error fetching teacher profile:", err);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    const profile = results[0];
    res.status(200).json({ success: true, profile });
  });
});
// Get all subjects for a particular class
app.get('/api/subjects/:class', (req, res) => {
  const className = req.params.class;  // Changed variable name to avoid conflict with 'class'
  const query = 'SELECT * FROM subjects WHERE class = ?';  // Changed 'class_name' to 'class'

  connection.query(query, [className], (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'Error fetching subjects', error: err });
    }
    res.status(200).json(results);
  });
});

// Add a new subject
app.post('/api/subjects', (req, res) => {
  const { subject_code, subject_name, class_name } = req.body;

  const query = 'INSERT INTO subjects (subject_code, subject_name, class) VALUES (?, ?, ?)';  // Changed 'class_name' to 'class'
  
  connection.query(query, [subject_code, subject_name, class_name], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error adding subject', error: err });
    }
    res.status(200).json({ message: 'Subject added successfully', subject_code });
  });
});
// Add a new subject
app.post('/api/subjects', (req, res) => {
  const { subject_code, subject_name, class_name } = req.body;

  const query = 'INSERT INTO subjects (subject_code, subject_name, class) VALUES (?, ?, ?)';

  conndection.query(query, [subject_code, subject_name, class_name], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error adding subject', error: err });
    }
    res.status(200).json({ message: 'Subject added successfully', subject_code });
  });
});

// Get all subjects for a particular class
app.get('/api/subjects/:class', (req, res) => {
  const className = req.params.class;
  const query = 'SELECT * FROM subjects WHERE class = ?';

  connection.query(query, [className], (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'Error fetching subjects', error: err });
    }
    res.status(200).json(results);
  });
});

// Delete a subject
app.delete('/api/subjects/:subject_code', (req, res) => {
  const { subject_code } = req.params;

  const query = 'DELETE FROM subjects WHERE subject_code = ?';

  connection.query(query, [subject_code], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error deleting subject', error: err });
    }
    res.status(200).json({ message: 'Subject deleted successfully' });
  });
});
// Get all teachers
app.get("/teachers", async (req, res) => {
  try {
    const teachers = await connection.query("SELECT * FROM teachers");
    res.json(teachers.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching teachers" });
  }
});

// Get all subjects
app.get("/subjects", async (req, res) => {
  try {
    const subjects = await connection.query("SELECT * FROM teacher_subject_allocation");
    res.json(subjects.rows); // Corrected this line to send subjects.rows
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects" });
  }
});

// Get all teacher-subject allocations
app.get("/teacher_subject_allocation", async (req, res) => {
  try {
    const allocations = await connection.query("SELECT * FROM teacher_subject_allocation");
    res.json(allocations.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching allocations" });
  }
});

// Allocate subject to teacher
app.post("/teacher_subject_allocation", async (req, res) => {
  const { teacher_name, subject_code, subject_name, class: className } = req.body; // Rename 'class' to 'className'
  try {
    const result = await connection.query(
      "INSERT INTO teacher_subject_allocation (teacher_name, subject_code, subject_name, class) VALUES ($1, $2, $3, $4) RETURNING *",
      [teacher_name, subject_code, subject_name, className] // Use className instead of class
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error allocating subject" });
  }
});


// Delete subject allocation
app.delete("/teacher_subject_allocation/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await connection.query("DELETE FROM teacher_subject_allocation WHERE id = $1", [id]);
    res.status(200).json({ message: "Allocation deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting allocation" });
  }
});
// Add a new notice
app.post("/api/notices", (req, res) => {
  const { audience, title, description } = req.body;

  // Validate input fields
  if (!audience || !title || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = "INSERT INTO notices (audience, title, description) VALUES (?, ?, ?)";
  connection.query(query, [audience, title, description], (err, result) => {
    if (err) {
      console.error("Error inserting notice:", err);
      return res.status(500).json({ error: "Failed to add notice." });
    }

    res.status(201).json({ message: "Notice added successfully!" });
  });
});

// Get all notices
app.get("/api/notices", (req, res) => {
  const query = "SELECT * FROM notices ORDER BY created_at DESC";
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching notices:", err);
      return res.status(500).json({ error: "Failed to fetch notices." });
    }

    res.status(200).json(results);
  });
});

// Delete a notice by ID
app.delete("/api/notices/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM notices WHERE id = ?";
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting notice:", err);
      return res.status(500).json({ error: "Failed to delete notice." });
    }

    res.status(200).json({ message: "Notice deleted successfully!" });
  });
});
app.get("/api/stats", (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM teachers) AS totalTeachers,
      (SELECT COUNT(*) FROM students) AS totalStudents,
      (SELECT COUNT(DISTINCT class) FROM students) AS totalClasses
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching stats:", err);
      return res.status(500).json({ error: "Failed to fetch stats." });
    }

    res.json(results[0]); // Return the result
  });
});
// API to fetch timetable for a specific class
app.get('/timetable/:class', (req, res) => {
  const { class: className } = req.params;

  const query = 'SELECT day, period, subject_details FROM students_timetable WHERE class = ?';
  connection.query(query, [className], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch timetable.' });
    } else {
      res.status(200).json(results);
    }
  });
})
// Endpoint to fetch assignments by teacher_id
app.get('/api/assignments/:teacher_id', (req, res) => {
  const { teacher_id } = req.params;
  
  // SQL Query to fetch assignments for the given teacher_id
  const sql = 'SELECT * FROM teacherassignment WHERE teacher_id = ?';

  connection.query(sql, [teacher_id], (err, results) => {
    if (err) {
      console.error('Error fetching assignments:', err.message);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: `No assignments found for teacher_id: ${teacher_id}` });
    }

    res.status(200).json(results);
  });
})
// Endpoint to fetch assignments to studentassignments
app.get('/students/assignments/:class', (req, res) => {
  const { class: className } = req.params;
  
  // SQL Query to fetch assignments for the given class
  const sql = 'SELECT * FROM teacherassignment WHERE class = ?';

  connection.query(sql, [className], (err, results) => {
    if (err) {
      console.error('Error fetching assignments:', err.message);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: `No assignments found for class: ${className}` });
    }

    res.status(200).json(results);
  });
});
// Endpoint to count assignments for a dynamic class
app.get('/api/assignment-count/:class', (req, res) => {
  const { class: className } = req.params; // Get class from URL parameter

  const query = "SELECT COUNT(*) AS assignment_count FROM teacherassignment WHERE class = ?";
  
  connection.query(query, [className], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Server Error');
    }
    res.json(results[0]); // Send the count as JSON response
  });
});

// Endpoint to count subjects for a dynamic class
app.get('/api/subject-count/:class', (req, res) => {
  const { class: className } = req.params; // Get class from URL parameter

  const query = "SELECT COUNT(*) AS subject_count FROM subjects WHERE class = ?";
  
  connection.query(query, [className], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Server Error');
    }
    res.json(results[0]); // Send the count as JSON response
  });
});
// Route to fetch timetable by teacherId
app.get('/teachertimetable/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;

  // Query to fetch timetable data for the given teacherId
  const query = 'SELECT * FROM teachers_timetable WHERE teacherId = ?';

  connection.query(query, [teacherId], (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Failed to fetch data' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'No records found for the given teacherId' });
      }

      // Send the timetable data as the response
      res.status(200).json(results);
  });
});
// Route to select teacherId using parameter and display class, subject, and assignment
app.get('/teacherassignments/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId; // get teacherId from URL parameter
  
  // SQL query to get class, subject, and assignment based on teacherId
  const query = `
    SELECT id, class, subject, assignment
    FROM assignment
    WHERE teacherId = ?;
  `;
  
  connection.query(query, [teacherId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ data: results });
    }
  });
});
// Insert data into the assignment table
app.post('/teacherassignments/:teacherId', (req, res) => {
  const { class: className, subject, assignment } = req.body;
  const { teacherId } = req.params;

  if (!teacherId || !className || !subject || !assignment) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Create SQL query to insert data
  const query = `
    INSERT INTO assignment (class, subject, teacherId, assignment) 
    VALUES (?, ?, ?, ?)
  `;
  const values = [className, subject, teacherId, assignment];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ message: 'Error inserting data', error: err });
    }

    res.status(201).json({
      message: 'Assignment added successfully',
      assignment: {
        id: results.insertId, // Returning the ID of the inserted assignment
        class: className,
        subject,
        teacherId,
        assignment,
      },
    });
  });
});
app.delete('/teacherassignments/:teacherId/:assignmentId', (req, res) => {
  const { teacherId, assignmentId } = req.params;

  // Check if teacherId and assignmentId are provided
  if (!teacherId || !assignmentId) {
    return res.status(400).json({ message: 'teacherId and assignmentId are required' });
  }

  // Create SQL query to delete the assignment
  const query = `DELETE FROM assignment WHERE id = ? AND teacherId = ?`;

  connection.query(query, [assignmentId, teacherId], (err, results) => {
    if (err) {
      console.error('Error deleting assignment:', err);
      return res.status(500).json({ message: 'Error deleting assignment', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Assignment not found or does not belong to this teacher' });
    }

    res.status(200).json({ message: 'Assignment deleted successfully' });
  });
});
// Endpoint to fetch assignments by class
app.get('/Studentassignments/:class', (req, res) => {
  const className = req.params.class;

  const query = 'SELECT class, subject, teacherId, assignment FROM assignment WHERE class = ?';
  
  connection.query(query, [className], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching data');
      return;
    }
    res.json(results);
  });
});
// POST route to insert a complaint (now using URL params for class and fullname)
app.post('/complains/:class/:fullName', (req, res) => {
  const { class: className, fullName } = req.params; // Extract class and fullname from URL params
  const { teacherId, description, status } = req.body;

  // Check if required fields are provided
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // If teacherId is not provided, set it to null
  const complaintTeacherId = teacherId || null;

  // Set default status if not provided
  const complaintStatus = status || 'pending';

  const query = `
    INSERT INTO complains (teacherId, class, fullName, description, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  // Insert the complaint into the database
  connection.query(query, [complaintTeacherId, className, fullName, description, complaintStatus], (err, result) => {
    if (err) {
      console.error('Error inserting complaint:', err);
      return res.status(500).json({ error: 'Failed to insert complaint' });
    }
    res.status(201).json({ message: 'Complaint submitted successfully', complaintId: result.insertId });
  });
});
// GET route to fetch complaints by class and fullname
app.get('/complains/:class/:fullName', (req, res) => {
  const { class: className, fullName } = req.params;

  const query = `
    SELECT id, class, fullName, description, status, created_at
    FROM complains
    WHERE class = ? AND fullName = ?
  `;

  // Execute the query to fetch data from the database
  connection.query(query, [className, fullName], (err, result) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'No complaints found for this class and fullname' });
    }
    res.status(200).json(result);
  });
});
// DELETE route to remove a complaint by its ID
app.delete('/complains/:id', (req, res) => {
  const { id } = req.params;

  // SQL query to delete the complaint
  const query = 'DELETE FROM complains WHERE id = ?';

  // Execute the query to delete the complaint
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting complaint:', err);
      return res.status(500).json({ error: 'Failed to delete complaint' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({ message: 'Complaint deleted successfully' });
  });
});
// GET route to fetch complaints by teacherId
app.get('/complains/:teacherId', (req, res) => {
  const { teacherId } = req.params; // Extract teacherId from the URL params

  // Check if teacherId is provided and is a valid value
  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID is required' });
  }

  // SQL query to fetch complaints by teacherId (excluding class and fullname)
  const query = `
    SELECT id, teacherId, description, status, created_at
    FROM complains
    WHERE teacherId = ?
  `;

  // Execute the query to fetch complaints from the database
  connection.query(query, [teacherId], (err, result) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'No complaints found for this teacher' });
    }

    // Send the result back to the client
    res.status(200).json(result);
  });
});

// POST route to insert a complaint (now using URL params for teacherId)
app.post('/complains/:teacherId', (req, res) => {
  const { teacherId } = req.params; // Extract teacherId from URL params
  const { description, status } = req.body;

  // Check if the description is provided
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // Set default status if not provided
  const complaintStatus = status || 'pending';

  // SQL query to insert the complaint into the database
  const query = `
    INSERT INTO complains (teacherId, description, status)
    VALUES (?, ?, ?)
  `;

  // Execute the query
  connection.query(query, [teacherId, description, complaintStatus], (err, result) => {
    if (err) {
      console.error('Error inserting complaint:', err);
      return res.status(500).json({ error: 'Failed to insert complaint' });
    }
    res.status(201).json({ message: 'Complaint submitted successfully', complaintId: result.insertId });
  });
});
// GET route to fetch all complaints
app.get('/complains', (req, res) => {
  const query = `
    SELECT id, teacherId, class, fullname, description, status, created_at
    FROM complains
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }

    res.status(200).json(results);
  });
});

// PUT route to update the status of a complaint (admin functionality)
app.put('/complains/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const query = `
    UPDATE complains
    SET status = ?
    WHERE id = ?
  `;

  connection.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating complaint status:', err);
      return res.status(500).json({ error: 'Failed to update complaint status' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({ message: 'Complaint status updated successfully' });
  });
});
// API Route to Fetch Students Data
app.get('/students', (req, res) => {
  const sql = 'SELECT id, fullName, class, password FROM students';
  connection.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});

// Delete student by ID
app.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM students WHERE id = ?';
  
  connection.query(sql, [id], (err, result) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Student deleted successfully' });
  });
});
// Add a new student (auto-increment ID, plain text password)
app.post('/students', (req, res) => {
  const { fullName, studentClass, password } = req.body;

  if (!fullName || !studentClass || !password) {
      return res.status(400).json({ error: 'Full Name, Class, and Password are required' });
  }

  const sql = 'INSERT INTO students (fullName, class, password) VALUES (?, ?, ?)';
  
  connection.query(sql, [fullName, studentClass, password], (err, result) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Student added successfully', id: result.insertId });
  });
});

// API route to fetch teachers
app.get('/api/teachers', (req, res) => {
  const query = 'SELECT teacherId, name, email, password FROM teachers';
  
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching teachers data', error: err });
    } else {
      res.json(results);
    }
  });
});


// API route to delete a teacher by teacherId
app.delete('/api/teachers/:id', (req, res) => {
  const teacherId = req.params.id;
  const query = 'DELETE FROM teachers WHERE teacherId = ?';
  
  connection.query(query, [teacherId], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error deleting teacher', error: err });
    } else {
      res.status(200).json({ message: 'Teacher deleted successfully', teacherId });
    }
  });
});
// API route to add a new teacher (POST)
app.post('/api/teachers', (req, res) => {
  const { teacherId, teacher_name,subject_code, email, password } = req.body;
  
  const query = 'INSERT INTO teachers (teacher_id, teacher_name, subject_code,email, password) VALUES (?, ?, ?, ?)';
  
  connection.query(query, [teacherId, teacher_name,subject_code, email, password], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error adding teacher', error: err });
    } else {
      res.status(200).json({ message: 'Teacher added successfully', teacherId });
    }
  });
});

// Route to fetch teacher_subject_allocation
app.get('/api/teacher_subject_allocation', (req, res) => {
  const query = 'SELECT teacher_name, subject_code, subject_name, class, teacher_id FROM teacher_subject_allocation';
  
  connection.query(query, (err, result) => {
    if (err) {
      res.status(500).send('Error fetching data');
      return;
    }
    res.json(result);
  });
});

// Route to delete a teacher-subject allocation
app.delete('/api/teacher_subject_allocation/:teacher_id', (req, res) => {
  const { teacher_id } = req.params;
  const query = 'DELETE FROM teacher_subject_allocation WHERE teacher_id = ?';
  
  connection.query(query, [teacher_id], (err, result) => {
    if (err) {
      res.status(500).send('Error deleting record');
      return;
    }
    res.send({ message: 'Record deleted successfully' });
  });
});
app.post('/api/teacher_subject_allocation', (req, res) => {
  const { teacher_name, subject_code, subject_name, class: className, teacher_id } = req.body;
  
  // Validate the data
  if (!teacher_name || !subject_code || !subject_name || !className || !teacher_id) {
    return res.status(400).send('All fields are required');
  }

  // Corrected query: Use backticks for `class`
  const query = 'INSERT INTO teacher_subject_allocation (teacher_name, subject_code, subject_name, `class`, teacher_id) VALUES (?, ?, ?, ?, ?)';

  connection.query(query, [teacher_name, subject_code, subject_name, className, teacher_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      res.status(500).send('Error inserting data');
      return;
    }
    res.status(201).send({ message: 'Record added successfully', id: result.insertId });
  });
});
// API endpoint
app.get('/api/teacher-timetable', (req, res) => {
  const teacherId = req.query.teacherId;

  // Query 1: Count total classes
  const countClassesQuery = `
    SELECT COUNT(*) AS total_classes
    FROM teachers_timetable
    WHERE teacherId = ?
  `;
  
  // Query 2: Count total assignments
  const countAssignmentsQuery = `
    SELECT COUNT(*) AS total_assignments
    FROM assignment
    WHERE teacherId = ?
  `;
  
  // Query 3: Get distinct subjects
  const distinctSubjectsQuery = `
    SELECT DISTINCT subject
    FROM assignment
    WHERE teacherId = ?
  `;
  
  connection.query(countClassesQuery, [teacherId], (err, classesResult) => {
    if (err) throw err;
    
    connection.query(countAssignmentsQuery, [teacherId], (err, assignmentsResult) => {
      if (err) throw err;

      connection.query(distinctSubjectsQuery, [teacherId], (err, subjectsResult) => {
        if (err) throw err;

        // Combine the results and send them as a response
        res.json({
          totalClasses: classesResult[0].total_classes,
          totalAssignments: assignmentsResult[0].total_assignments,
          subjects: subjectsResult.map(row => row.subject)
        });
      });
    });
  });
});
// Route to fetch notices for 'teachers'
app.get('/api/notices', (req, res) => {
  const query = "SELECT title, description, created_at FROM notices WHERE audience = 'teachers'";

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Error fetching notices');
    }
    res.json(results);  // Send the results back as JSON
  });
});
// Route to fetch notices for 'teachers'
app.get('/api/notices', (req, res) => {
  const query = "SELECT title, description, created_at FROM notices WHERE audience = 'students'";

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Error fetching notices');
    }
    res.json(results);  // Send the results back as JSON
  });
});


// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



