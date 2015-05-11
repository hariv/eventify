var Event=require('../app/models/Event');
var User=require('../app/models/User');
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
exports.getUserHandle=getUserHandle;