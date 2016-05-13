var mongoose = require('mongoose');
var crypto = require('crypto');

var userSchema = new mongoose.Schema({
	name: String,
	nick: String,
	password: String,
	email: String,
	head: String,
	types: {
		type: Array,
		default: [{
			name: 'JavaScript',
			time: '0000-00-00 00:00'
		}]
	},
	lastmodifiedtime: Object,
	sex: String,
	birthday: String,
	maritalstatus: String,
	profession: String,
	address: String,
	nativeplace: String,
	educationexperience: Array,
	sign: String
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
	getUser: function(name, callback) {
		userModel.findOne({
			name: name
		}, function(err, user) {
			if (err) {
				return callback(err);
			}
			user = {
				name: user.name,
				sign: user.sign,
				head: user.head
			};
			callback(null, user);
		});
	},
	save: function(name, password, email, callback) {
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(email.toLowerCase()).digest('hex'),
			head = 'http://cn.gravatar.com/avatar/' + email_MD5 + '?s=48';

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
		var newUser = new userModel({
			name: name,
			nick: name,
			password: password,
			email: email,
			head: head,
			lastmodifiedtime: time,
			sex: '',
			birthday: '',
			maritalstatus: '',
			profession: '',
			address: '',
			nativeplace: '',
			educationexperience: [],
			sign: ''
		});
		newUser.save(function(err, user) {
			if (err) {
				return callback(err);
			} else {
				callback(null, user);
			}
		});
	},
	//修改个人信息
	updateInfo: function(name, email, sex, birthday, maritalstatus, profession, address, nativeplace, educationexperience, sign, callback) {
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
		userModel.findOne({
			"name": name,
			"email": email
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			if (doc) {
				this.update({
					"name": name,
					"email": email
				}, {
					$set: {
						sex: sex,
						birthday: birthday,
						maritalstatus: maritalstatus,
						profession: profession,
						address: address,
						nativeplace: nativeplace,
						educationexperience: educationexperience,
						sign: sign,
						lastmodifiedtime: time
					}
				}, function(err) {
					if (err) {
						return callback(err);
					}
				});
				var docs = {
					sex: doc.sex,
					birthday: doc.birthday,
					maritalstatus: doc.maritalstatus,
					profession: doc.profession,
					address: doc.address,
					nativeplace: doc.nativeplace,
					educationexperience: doc.educationexperience,
					sign: doc.sign
				};
				callback(null, docs);
			}
		});
	},
	//修改密码
	updatePassword: function(name, password, newPassword, callback) {
		var md5 = crypto.createHash('md5'),
			p = md5.update(password).digest('hex');
		var md51 = crypto.createHash('md5'),
			newP = md51.update(newPassword).digest('hex');
		userModel.findOne({
			name: name,
			password: p
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			if (doc) {
				this.update({
					name: name,
					password: p
				}, {
					$set: {
						password: newP
					}
				}, function(err) {
					if (err) {
						return callback(err);
					}
				});
				callback(null);
			}
		});
	},
	//修改头像
	updatePic: function(name, head, nick, callback) {
		userModel.findOne({
			"name": name
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			if (doc) {
				this.update({
					"name": name
				}, {
					$set: {
						head: head,
						nick: nick
					}
				}, {
					upsert: true
				}, function(err) {
					if (err) {
						return callback(err);
					}
				});
				callback(null, doc);
			}
		});
	},
	//修改文章类型
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
	//获取文章类型
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