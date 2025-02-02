var mysql=require("mysql2")
require('dotenv').config();
var conn=mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database:"studygrid" 
});
console.log()
conn.connect((err)=>{
    if(err){
        console.log(err.message);
    }else{
        console.log("successfully connected")
    }
})
module.exports=conn