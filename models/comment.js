var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
	name: String,
	day: String,
	title: String,
	comment: Object
});

var commentModel = mongoose.model('posts', commentSchema);

module.exports = {
	saveComment: function(name, day, title, comment, callback) {
		commentModel.update({
			"name": name,
			"time.day": day,
			"title": title
		}, {
			$push: {
				"comments": comment
			}
		}, function(err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	}
};