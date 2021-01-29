// This is where the app starts

// Load external libraries
const express = require("express");
const collection = require("postman-collection").Collection;

// Setup API
const app = express();
app.use(express.json());

var validUrl = require('valid-url');

//generic base endpoint for app overview page
app.get("/", function(request, response) {
  response.send(
    "Hi! This is an API that uses the Postman collection runner Newman to check training submissions for completeness!"
  );
});

// Status endpoint
app.get("/status", function(request, response) {
  response.send("OK");
});

app.get("/verify", function(request, response) { 
  if (!request.query.collectionUrl) {
    response.status(400);
    response.send({ error: "collectionUrl param not found" });
  }

  const req = require("request");

  let url = request.query.collectionUrl;
  if (!validUrl.isUri(url))
    response.status(400).json({message: "No collection URL provided"});

  let options = { json: true };
  req(url, options, (error, res, body) => {
    if (error) {
      return console.log(error);
    }

    if (!error && res.statusCode == 200) {
      let myCollection = new collection(body);
      let requests = myCollection.toJSON().item;
      let tests = [], pre = false, fails = [];
      for(const apireq of requests){
        if(apireq.event.length>1) pre=true;
        for(const ev of apireq.event){
          tests.push(ev.script.exec.join(' '));
        }
      }
      let scriptText=tests.join(' ');
      
      //TODO accommodate variations if we aren't requiring exact syntax
      //assignment checks def not robust lol
      if(!pre) fails.push("No pre-request script included");
      if(tests.length<4) fails.push("Not all tests included");
      let scriptElements = [
        {
          elem: "pm.response.json",
          message: "No script parsing response body"
        },
        {
          elem: "pm.globals.set",
          message: "No script setting a global variable"
        },
        {
          elem: "sku",
          message: "Assignment to save sku variable not completed"
        },
        {
          elem: "orderId",
          message: "Assignment to save orderId not completed"
        },
        {
          elem: "201",
          message: "Assignment to check for 201 status not completed"
        },
        {
          elem: "created",
          message: "Assignment to check created property not completed"
        },
        {
          elem: "true",
          message: "Assignment to check for true value not completed"
        },
        {
          elem: "number",
          message: "Assignment to check for number not completed"
        },
        {
          elem: "to.have.status",
          message: "No status check"
        },
        {
          elem: "to.have.property",
          message: "No property check"
        },
        {
          elem: "to.be.a",
          message: "No type check"
        },
        {
          elem: "to.eql",
          message: "No property value equality check"
        },
        {
          elem: "setNextRequest",
          message: "No script setting request execution order"
        },
        {
          elem: "to.have.jsonSchema",
          message: "No schema validation test"
        }
      ];
      for(const el of scriptElements){
        if(scriptText.indexOf(el.elem)<0) fails.push(el.message);
      }
      let result = {};
      if(fails.length>0){ 
        result.completed=false; 
        result.message="Oops! Your collection is still missing some parts. Check out what's missing below and go back through the steps "+
            "in the request documentation. 🙂"
        result.fails=fails;
      }
      else {
        result.completed=true;
        result.message="Your collection is complete! Fill out the form at bit.ly/submit-api-testing to get your badge and swag! 🏆"
      }
      response.send(result);
    }
  });

});

// Listen for incoming requests
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
