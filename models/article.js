var mongoose = require('mongoose');

var articleTypeSchema = new mongoose.Schema({
	user: String,
	types: {type: Array, default: [JavaScript]}
});

var articleTypeModel = mongoose.model('articleTypes', articleTypeSchema);

module.exports = {
	save: function(user, type, callback) {
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
			'user': user,
			'type': type,
			'time.day': time.day
		};
		var newArticleType = new articleTypeModel(d);
		articleTypeModel.save(function(err, post) {
			if (err) {
				return callback(err);
			} else {
				callback(null, post);
			}
		});
	},
	update: function(user, type, callback) {
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
		articleModel.update({
			"time.day": time.day,
			"user": user
		}, {
			$push: {
				"types": type
			}
		}, function(err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	},
	get: function(user, callback) {
		var query = {};
		if (user) {
			query.user = user;
		}
		articleModel.find(query).sort({
			time: 1
		}).exec(function(err, docs) {
			if (err) {
				return callback(err);
			}

			callback(null, docs);
		});
	}
};