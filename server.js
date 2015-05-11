var Event=require('./app/models/Event');
var User=require('./app/models/User');
var express=require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session=require('express-session');
app.use(session({secret: 'ssshhhhh',
		 resave: true,
		 saveUninitialized: true}));
mongoose.connect('mongodb://localhost:27017/eventify');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port=process.env.PORT || 8080;
app.get('/',function(req,res){
    res.json({message: 'hooray! welcome to our api!'});
});
app.get('/users/:handle',function(req,res){
    var handle=req.params.handle;
    User.findOne({handle: handle},function(err,user){
	if(err){
	    console.log("Error querying users for GET /users/:handle");
	    console.log(err);
	    res.end(err);
	}
	res.json(user);
    });
});
app.post('/users/',function(req,res){
    var handle=req.body.handle;
    var password=req.body.password;
    var name=req.body.name;
    User.findOne({handle: handle},function(err,user){
	if(err){
	    console.log("Error querying users for POST /users");
            console.log(err);
            res.end(err);
	}
	if(user.length > 0)
	    res.json({message: 'User already exists'});
	else{
	    var user=new User();
	    user.handle=handle;
	    user.password=password;
	    user.name=name;
	    user.save(function(err){
		if(err){
		    console.log("Error inserting user for POST /users");
		    console.log(err);
		    res.end(err);
		}
		res.json({message: 'User Created'});
	    });
	}
    });
    
});
app.post('/events',function(req,res){
    if(req.session.userId){
	var event=new Event();
	var userId=req.session.userId;
	event.name=req.body.name;
	event.location.latitude=req.body.latitude;                                                                                                
        event.location.longitude=req.body.longitude;                                                                                              
        event.location.time=req.body.time;   
	event.owner=userId;
	event.save(function(err){
	    if(err){
		console.log("Error inserting event for POST /events");
		console.log(err);
		res.send(err);
	    }
	    res.json({message: 'Event Created'});
	});
    }
    else
	res.json({message: 'Unauthorized'});
});
app.put('/events/:code',function(req,res){
    var code=req.params.code;
    if(req.session.userId){
	var userId=req.session.userId;
	Event.findOne({ezCode: code},function(err,event){
	    if(err){
		console.log("Error fetching event for PUT /events/:code");
		console.log(err);
		res.send(err);
	    }
	    if(event.owner==userId){
		event.name=req.body.name;
		event.location.latitude=req.body.latitude;
		event.location.longitude=req.body.longitude;
		event.location.time=req.body.time;
		event.save(function(error){
		    if(error){
			console.log("Error updating event for PUT /events/:code");
			console.log(error);
			res.end(error);
		    }
		    res.json({message: 'Event Updated'});
		});
	    }
	    else
		res.json({message: 'Unauthorized'});
	});
    }
    else
	res.json({message: 'Unauthorized'});
});
app.delete('/events/:code',function(req,res){
    var code=req.params.code;
    if(req.session.userId){
	var userId=req.session.userId;
	Event.findOne({ezCode: code},function(err,event){
	    if(err){
		console.log("Error fetching event for DELETE /events/:code");
		console.log(err);
		res.send(err);
	    }
	    if(event.owner==userId){
		var eventId=event._id;
		Event.remove({_id: eventId},function(error,evt){
		    if(error){
			console.log("Error removing event for DELETE /events/:code");
			console.log(error);
			res.send(error);
		    }
		    res.json({message: 'Event deleted'});
		});
	    }
	    res.json({message: 'Unauthorized'});
	});
    }
    res.json({message: 'Unauthorized'});
});
app.listen(port);
console.log("Server running on port "+port);