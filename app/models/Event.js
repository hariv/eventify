var mongoose=require('mongoose');
var eventSchema=mongoose.Schema({
    name: String,
    ezCode: String,
    location: {
	latitude: Number,
	longitude: Number
    },
    date: {
    start: Date,
    end: Date
    },
    owner: Number,
    guests: [Number],
    eventType: {type: String, default:"public"}
});
var Event=mongoose.model('Event', eventSchema);
module.exports=Event;
