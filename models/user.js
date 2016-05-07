var mongoose = require('mongoose');
var crypto = require('crypto');

var userSchema = new mongoose.Schema({
	name: String,
	password: String,
	email: String,
	head: String,
	types: {
		type: Array,
		default: [{
			name: 'JavaScript',
			time: '0000-00-00 00:00'
		}]
	}
});

var userModel = mongoose.model('users', userSchema);

module.exports = {
	get: function(name, callback) {
		userModel.findOne({
			name: name
		}, function(err, user) {
			if (err) {
				return callback(err);
			}
			callback(null, user);
		});
	},
	save: function(name, password, email, callback) {
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(email.toLowerCase()).digest('hex'),
			head = 'http://cn.gravatar.com/avatar/' + email_MD5 + '?s=48';
		var newUser = new userModel({
			name: name,
			password: password,
			email: email,
			head: head
		});
		newUser.save(function(err, user) {
			if (err) {
				return callback(err);
			} else {
				callback(null, user);
			}
		});
	},
	updateArticleTypes: function(name, type, callback) {
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
		userModel.update({
			"name": name
		}, {
			$push: {
				"types": {
					"name": type,
					"time": time.minute
				}
			}
		}, function(err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	},
	getArticleTypes: function(name, callback) {
		var query = {
			"name": name
		};
		userModel.findOne(query)
			.exec(function(err, docs) {
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
	}
};