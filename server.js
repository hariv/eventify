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
app.post('/login',function(req,res){
    if(!req.session.userId){
	var handle=req.body.handle;
	var password=req.body.password;
	User.findOne({ $and:[ {handle: handle}, {password: password} ]},function(err,user){
	    if(err){
		console.log("Error authenticating user for POST /login");
		console.log(err);
		res.send(err);
	    }
	    if(user){
		req.session.userId=user._id;
		res.json({message: "Authentication success"});
	    }
	    else
		res.json({message: "Authentication failure"});
	});
    }
    else
	res.json({message: "Already logged in"});
});
app.post('/logout',function(req,res){
    if(req.session.userId){
	req.session.userId=null;
	req.json({message: "Logout successful"});
    }
    else
	res.json({message: "Already logged out"});
});
app.delete('/cronEvents',function(req,res){
    var now=new Date();
    var query=Event.find({});
    query.where('date.end').lt(now).exec(function(err,events){
	if(err){
	    console.log("Error fetching events for DELETE /cronEvents");
	    console.log(err);
	    res.send(err);
	}
	events.remove.exec();
	res.json({message: "Cron execution successful"});
    });
});
app.post('/events',function(req,res){
    if(req.session.userId){
	var userId=req.session.userId;
	var eventsArray=new Array();
	var codeCount=new Array(8).join('0').split('').map(parseFloat);
	util.getUserHandle(userId,function(response){
	    if(!response)
		res.send("Error fetching user handle");
	    Event.find({},function(error,events){
		if(error){
		    console.log("Error in fetching all events");
		    console.log(error);
		    res.send(error);
		}
		for(var i=0;i<events.length;i++){
		    eventsArray.push(events[i].ezCode);
		    codeCount[events[i].ezCode-4]++;
		}
		var event=new Event();
		event.name=req.body.name;
		event.location.latitude=req.body.latitude;
		event.location.longitude=req.body.longitude;
		event.date.start=req.body.start;
		event.date.end=req.body.end;
		event.eventType=req.body.eventType;
		event.owner=response;
		var now=new Date().getTime()/1000;
		var timeRemaining=req.body.start.getTime()/1000-now;
		var requiredLength;
		var index;
		var baseNum;
		if(timeRemaining<604800){
		    index=0;
		    baseNum=9000;
		    while(index<7){
			if(codeCount[index]<baseNum){
			    requiredLength=4;
			    break;
			}
			else{
			    index++;
			    baseNum*=10;
			}
		    }
		}
		else if(timeRemaining<1029600){
		    index=2;
		    baseNum=900000;
		    while(index<7){
			if(codeCount[index]<baseNum){
			    requiredLength=6;
			    break;
			}
			else{
			    index++;
			    baseNum*=10;
			}
		    }
		}
		else if(timeRemaining<2419200){
		    index=4;
		    baseNum=90000000;
		    while(index<7){
			if(codeCount[index]<baseNum){
			    requiredLength=8;
			    break;
			}
			else{
			    index++;
			    baseNum*=10;
			}
		    }
		}
		else
		    requiredLength=10;
		var generatedCode=false;
		var ezCode;
		while(!generatedCode){
		    ezCode=util.generateCode(requiredLength);
		    if(eventsArray.indexOf(ezCode)==-1)
			generatedCode=true;
		}
		event.ezCode=ezCode;
		event.save(function(err){
		    if(err){
			console.log("Error inserting event for POST /events");
			console.log(err);
			res.send(err);
		    }
		    res.json({message: 'Event Created'});
		});
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
		    var oldEventId=event._id;
		    var updatedEvent=new Event();
		    updatedEvent.name=req.body.name;
                    updatedEvent.location.latitude=req.body.latitude;
                    updatedEvent.location.longitude=req.body.longitude;
                    updatedEvent.date.start=req.body.start; 
    		    updatedEvent.date.end=req.body.end;
    		    updatedEvent.eventType=req.body.eventType;
		    Event.remove({_id: oldEventId},function(error,evt){
			if(error){
			    console.log("Error deleting event for PUT /events/:code");
			    console.log(error);
			    res.send(error);
			}
			updatedEvent.save(function(error){
			    if(error){
				console.log("Error creating event for PUT /events/:code");
				console.log(error);
				res.send(error);
			    }
			    res.json({message: 'Event updated'});
			});
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
		    res.json({message: 'Unauthorized koothi'});
	    });
	});
    }
    else
	res.json({message: 'Unauthorized punda'});
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
		    res.send("Error fetching user handle");
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
app.delete('/event/:code/guests',function(req,res){
    var code=req.params.code;
    var deleteHandle=req.body.handle;
    if(req.session.userId){
	var userId=req.session.userId;
	Event.findOne({ezCode: code},function(err,event){
	    if(err){
		console.log("Error fetching event for DELETE /event/:code/guests");
		console.log(err);
		res.send(err);
	    }
	    if(deleteHandle==event.owner)
		res.json({message: "Owner can't delete himself"});
	    util.getUserHandle(userId,function(response){
		if(!response)
		    res.send("Error fetching user handle");
		if(deleteHandle==response || deleteHandle==event.owner){
		    var deleteIndex=event.guests.indexOf(deleteHandle);
		    var deleteId=event._id;
		    if(deleteIndex==-1)
			res.json({message: "User you are trying to remove is not part of the event"});
		    event.guests.splice(deleteIndex,1);
		}
		var updatedEvent=new Event();
		updatedEvent.name=event.name;
		updatedEvent.ezCode=event.ezCode;
		updatedEvent.location.latitude=event.location.latitude;
		updatedEvent.location.longitude=event.location.longitude;
		updatedEvent.date.start=event.date.start;
		updatedEvent.date.end=event.date.end;
		updatedEvent.owner=event.owner;
		updatedEvent.guests=event.guests;
		updatedEvent.eventType=event.eventType;
		Event.remove({_id: deleteId},function(error,evt){
		    if(error){
			console.log("Error deleting event for DELETE /events/:code/guests");
			console.log(error);
			res.send(error);
		    }
		    updatedEvent.save(function(saveError){
			if(saveError){
			    console.log("Error saving event for DELETE /events/:code/guests");
			    console.log(saveError);
			    res.end(saveError);
			}
			res.json({message: "Successfully removed guest"});
		    });
		});
	    });
	});
    }
    else
	res.json({message: "Unauthorized"});
});
app.get('/events', function(req, res){
    Event.where('eventType').equals('public').exec(function(err, events){
	if(err){
	    console.log("Error fetching all events for GET /events");
	    console.log(err);
	    res.send(err);
	}
	res.json(events);
    });
});
app.get('/allevents', function(req, res){
    if(req.session.userId){
	var userId=req.session.userId;
	util.getUserHandle(userId,function(response){
	    if(!response)
		res.send("Error fetching user handle");
	    Event.where('owner').equals(response).exec(function(err,evts)){
		if(err){
		    console.log("Error fetching events for GET /allevents");
		    console.log(err);
		    res.send(err);
		}
		var eventsArray=evts;
		Event.find({},function(error,events){
		    for(var i=0;i<events.length;i++){
			if(events[i].guests.indexOf(response)!=-1)
			    eventsArray.push(events[i]);
		    }
		    res.json(eventsArray);
		});
	    }
	});
    }
    else
	res.json({message: "Unauthorized"});
    
});
app.get('/events/:code', function(req,res){
    Event.findOne({ $and:[ {ezCode: req.params.code}, {eventType: "public"} ]}, function(err,event){
	if(err){
	    console.log("Error fetching event for GET /events/:code");
	    console.log(err);
	    res.send(err);
	}
	res.json(event);
    });
});
app.get('/events/:code/guests',function(req,res){
    var code=req.params.code;
    Event.findOne({ezCode: code},function(err,event){
	if(err){
	    console.log("Error finding event for GET /events/:code/guests");
	    console.log(err);
	    res.send(err);
	}
	var guests=event.guests;
	util.getAllUsers(guests,function(response){
	    if(!response){
		res.send("Error getting user details for /events/:code/guests");
	    }
	    res.json(response);
	});
    });
});

app.listen(port);
console.log("Server running on port "+port);
