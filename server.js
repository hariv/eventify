var Event=require('./app/models/Event');
var User=require('./app/models/User');
var util=require('./util/util');
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
	if(user)
	    res.json({message: 'User already exists'});
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
    });
});
app.post('/events',function(req,res){
    if(req.session.userId){
	var event=new Event();
	var userId=req.session.userId;
	util.getUserHandle(userId,function(response){
	    if(!response)
		res.send("Error fetching user handle");
	    event.name=req.body.name;
            event.location.latitude=req.body.latitude;
            event.location.longitude=req.body.longitude;
            event.location.time=req.body.time;
	    event.owner=response;
	    event.save(function(err){
		if(err){
		    console.log("Error inserting event for POST /events");
                    console.log(err);
                    res.send(err);
		}
		res.json({message: 'Event Created'});
	    });
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
	    util.getUserHandle(function(response){
		if(!response)
		    res.send("Error fetching user handle");
		if(event.owner==response){
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
		    res.json({message :'Unauthorized'});
	    });
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
	    util.getUserHandle(userId,function(response){
		if(!response)
		    res.send("Error in fetching user handle");
		if(event.owner==response){
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
		else
		    res.json({message: 'Unauthorized'});
	    });
	});
    }
    else
	res.json({message: 'Unauthorized'});
});
app.post('/event/:code/guests',function(req,res){
    var code=req.params.code;
    if(req.session.userId){
	var userId=req.session.userId;
	Event.findOne({ezCode: code},function(err,event){
	    if(err){
		console.log("Error fetching event for POST /events/:code/guests");
		console.log(err);
		res.send(err);
	    }
	    util.getUserHandle(userId,event,function(response){
		if(!response)
		    res.json({message: "Error in fetching user"});
		if(event.owner==response || event.guests.indexOf(response)==-1){
		    event.guests.push(response);
		    event.save(function(error){
			if(error){
			    console.log("Error adding user to array for POST /events/:code/guests");
			    console.log(error);
			    res.send(error);
			}
			res.json({message: "User has been added"});
		    });
		}
		res.json({message: "User is already part of this event"});
	    });
	});
    }
});

app.get('/events', function(req, res){
	Event.where('eventType').equals('public').exec(function(err, events){
		if(err)
			res.json({message:"Error fetching the users"});
		res.json(events);
	});
});

app.get('/allevents', function(req, res){
	Event.find(function(err, events){
		if(err)
			res.json({message:"Error fetching the users"});
		res.json(events);
	});
});

app.get('/events/:code', function(req,res){

	Event.findOne({ $and:[ {ezCode: req.params.code}, {eventType: "public"} ]}, function(err,event){
		if(err)
			res.json({message:"cannot get events/:code"});
		res.json(event);
	});

});


app.listen(port);
console.log("Server running on port "+port);
