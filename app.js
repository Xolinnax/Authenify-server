require("dotenv").config();
const express=require("express");
const bodyParser = require('body-parser');
const cors=require("cors");
const bcrypt=require("bcrypt");
const saltRounds=10;
const mongodb=require("mongodb");

const app=express();
app.use(bodyParser.json());

app.use(cors());

const uri=process.env.DB_LINK;

const client = new mongodb.MongoClient(uri);

var foundUsers=[];


async function findUsers()
{
    foundUsers=[];
    const authen=client.db("Authen");
    const users=authen.collection("users");
    const cursor=users.find({});
    for await (const doc of cursor) 
    {
        foundUsers.push(doc);
    }
}

async function Insert(newUserName,newPassword)
{
    const authen=client.db("Authen");
    const users=authen.collection("users");
    const newUser=
    {
        userName:newUserName,
        password:newPassword
    }
    const result = await users.insertOne(newUser);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
}

app.post('/register',function(req, res) 
{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) 
    {
        findUsers().then(function()
        {
            var found=false;
            for(var i=0;i<foundUsers.length;i++)
            {
                if(foundUsers[i].userName===req.body.name)
                {
                    found=true;
                }
            }
            if(!found)
            {
                Insert(req.body.name,hash);
                res.send(JSON.stringify({"registered":true}));
            }
            else
            {
                res.send(JSON.stringify({"registered":false}))
            }
        });
    });
});

app.get("/login",function(req,res)
{

    const username=req.query.name;
    const password=req.query.password;

    findUsers().then(function()
    {
        var foundUser=false;
        var foundUserIndex=0;
        for(var i=0;i<foundUsers.length;i++)
        {
            if(foundUsers[i].userName==username)
            {
                foundUser=true;
                foundUserIndex=i;
                break;
            }
        }
        if(foundUser)
        {
            bcrypt.compare(password,foundUsers[foundUserIndex].password,function(err,result)
            {
                if(result)
                {
                    res.send(JSON.stringify({"authen":true}));
                }
                else
                {
                    res.send(JSON.stringify({"authen":false}));
                }
            });
        }
        else
        {
            res.send(JSON.stringify({"authen":false}));
        }
          
    });
});
   
app.listen(5000, function() 
{
    console.log("Server running successfully on 5000");
});