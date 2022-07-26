const mysql = require('mysql');
const express = require('express');
let config = require('./config');

var app = express();
const bodyparser = require('body-parser');

app.use(bodyparser.json());

var mysqlConnection = mysql.createConnection(config);

mysqlConnection.connect((err)=>{
    if(!err){
        console.log("DB Connected");
    }
    else{
        console.log("DB Connection failed \n Error: "+ JSON.stringify(err,undefined,2));
    }
})

const port = process.env.PORT || 3000
app.listen(port, ()=> console.log(`Listening on port ${port}...`));

app.get('/api', (req,res) =>{
    res.send("VIDEO WEBSITE API");
});


app.get('/api/movies',(req,res)=>{

    let GetAllMovies = `CALL GetAllMovies()`
    mysqlConnection.query(GetAllMovies, (err,data,fields) =>{
        if(err){
            return console.err(err.message);
        }
        res.send(data);
    });
});