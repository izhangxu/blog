var mongoose = require('mongoose');

var postSchema = new mongoose.Schema({
	name: String,
	head: String,
	time: Object,
	title: String,
	post: String,
	tags: [String],
	type: String,
	comments: [],
	pv: Number
});

var postModel = mongoose.model('posts', postSchema);

module.exports = {
	save: function(name, head, title, tags, type, post, callback) {
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
		//要存入数据库的文档
		var d = {
			name: name,
			head: head,
			time: time,
			title: title,
			post: post,
			tags: tags,
			type: type,
			comments: [],
			pv: 0
		};
		var newPost = new postModel(d);
		newPost.save(function(err, post) {
			if (err) {
				return callback(err);
			} else {
				callback(null, post);
			}
		});
	},
	getTen: function(name, page, callback) {
		postModel.count({}, function(err, total) {
			this.find({})
				.limit(10)
				.skip((page - 1) * 10)
				.sort({
					time: -1
				})
				.exec(function(err, docs) {
					if (err) {
						return callback(err);
					}
					callback(null, docs, total);
				});
		});
	},
	getTenByType: function(type, page, callback) {
		postModel.count({
			'type': type
		}, function(err, total) {
			this.find({
					'type': type
				})
				.limit(10)
				.skip((page - 1) * 10)
				.sort({
					time: -1
				})
				.exec(function(err, docs) {
					if (err) {
						return callback(err);
					}
					callback(null, docs, total);
				});
		});
	},
	getOne: function(name, day, title, callback) {
		postModel.findOne({
			"name": name,
			"time.day": day,
			"title": title
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			if (doc) {
				//每访问 1 次，pv 值增加 1
				this.update({
					"name": name,
					"time.day": day,
					"title": title
				}, {
					$inc: {
						"pv": 1
					}
				}, function(err) {
					if (err) {
						return callback(err);
					}
				});
				callback(null, doc);
			}
		});
	},
	edit: function(name, day, title, callback) {
		postModel.findOne({
			"name": name,
			"time.day": day,
			"title": title
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			callback(null, doc);
		});
	},
	update: function(name, day, title, post, callback) {
		postModel.update({
			"name": name,
			"time.day": day,
			"title": title
		}, {
			$set: {
				post: post
			}
		}, function(err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	},
	remove: function(name, day, title, callback) {
		//根据用户名、日期和标题查找并删除一篇文章
		postModel.remove({
			"name": name,
			"time.day": day,
			"title": title
		}, function(err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	},
	getArchive: function(callback) {
		postModel.find({}, {
			'name': 1,
			'time': 1,
			'title': 1
		}).sort({
			time: -1
		}).exec(function(err, docs) {
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	},
	getTags: function(callback) {
		//distinct 用来找出给定键的所有不同值
		postModel.distinct('tags', function(err, docs) {
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	},
	getAllTypes: function(callback) {
		//distinct 用来找出给定键的所有不同值
		postModel.distinct('type', function(err, docs) {
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	},
	getTag: function(tag, callback) {
		//查询所有 tags 数组内包含 tag 的文档
		//并返回只含有 name、time、title 组成的数组
		postModel.find({
			"tags": tag
		}, {
			"name": 1,
			"time": 1,
			"title": 1
		}).sort({
			time: -1
		}).exec(function(err, docs) {
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	},
	search: function(keyword, callback) {
		var pattern = new RegExp(keyword, "i");
		postModel.find({
			"title": pattern
		}, {
			"name": 1,
			"time": 1,
			"title": 1
		}).sort({
			time: -1
		}).exec(function(err, docs) {
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	},
	saveComment: function(name, day, title, comment, callback) {
		postModel.update({
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
	},
	getTopFive: function(name, callback) {
		postModel.count({}, function(err) {
			this.find({})
				.limit(5)
				.sort({
					pv: -1
				})
				.exec(function(err, docs) {
					if (err) {
						return callback(err);
					}
					callback(null, docs);
				});
		});
	}
};