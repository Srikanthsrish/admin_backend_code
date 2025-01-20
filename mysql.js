var mysql=require("mysql2")
var conn=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"1716",
    database:"studygrid"
});
conn.connect((err)=>{
    if(err){
        console.log(err.message);
    }else{
        console.log("successfully connected")
    }
})
module.exports=conn