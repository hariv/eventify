var Event=require('../app/models/Event');
var User=require('../app/models/User');
var guestsArray=new Array();
var generateCode=function(size){
    var text="";
    var possible="0123456789";
    for(var i=0;i<size;i++)
        text+=possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
var getUserHandle=function(userId,callback){
    User.findOne({_id: userId},function(err,user){
	if(err){
	    console.log("Error fetching user");
	    console.log(err);
	    callback(false);
	}
	else
	    callback(user.handle);
    });
}
var getAllUsers=function(guests,callback){
    for(var i=0;i<guests.length;i++){
	var handle=guests[i].handle;
	getUser(handle,i,function(response,count){
	    if(!response)
		callback(false);
	    else{
		guestsArray.push(response);
		if(count==guests.length)
		    callback(guestsArray);
	    }
	});
    }
}
var getUser=function(handle,callback){
    User.findOne({handle: handle},function(err,user){
	if(err){
	    console.log("Error fetching user");
	    callback(false,i);
	}
	else
	    callback(user,i);
    });
}
exports.getUserHandle=getUserHandle;
exports.getUser=getUser;
exports.getAllUsers=getAllUsers;
exports.generateCode=generateCode;