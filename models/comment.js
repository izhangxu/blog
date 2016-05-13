var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
	url:String,
	comment: Object
});

var commentModel = mongoose.model('comments', commentSchema);

module.exports = {
	saveComment: function(name, day, title, comment, callback) {
		var date = new Date();
		//时间扩展
		var time = {
			date: date,
			year: date.getFullYear(),
			month: date.getFullYear() + "-" + (date.getMonth() + 1),
			day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
			minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
				date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
		};
		var d = {
			
		};
	}
};