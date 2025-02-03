var mysql=require("mysql2")
require('dotenv').config();
var conn=mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
conn.connect((err)=>{
    if(err){
        console.log(err.message);
    }else{
        console.log("successfully connected")
    }
})
module.exports=conn 
// const mysql = require("mysql2");
// require("dotenv").config();

// // ✅ Use a connection pool for better stability
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database:process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10, // Maximum active connections
//     queueLimit: 0,       // No limit on queued connections
//     connectTimeout: 10000, 
// });

// // ✅ Convert pool to synchronous-style queries
// const conn = pool.promise();

// // Test connection
// conn.query("SELECT 1")
//     .then(() => console.log("✅ Successfully connected to MySQL"))
//     .catch((err) => {
//         console.error("❌ MySQL Connection Error:", err.message);
//         process.exit(1);
//     });

// module.exports = conn;