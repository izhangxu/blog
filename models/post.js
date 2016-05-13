var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

var postSchema = new mongoose.Schema({
	name: String,
	head: String,
	time: Object,
	title: String,
	post: String,
	tags: [String],
	type: String,
	comments: [],
	firstPic: String,
	pv: Number
});

var postModel = mongoose.model('posts', postSchema);

module.exports = {
	save: function(name, head, title, tags, type, post, firstPic, callback) {
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
			firstPic: firstPic,
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
	getOne: function(_id, callback) {
		postModel.findOne({
			"_id": new ObjectID(_id)
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			if (doc) {
				//每访问 1 次，pv 值增加 1
				this.update({
					"_id": new ObjectID(_id)
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
	edit: function(_id, callback) {
		postModel.findOne({
			"_id": new ObjectID(_id)
		}, function(err, doc) {
			if (err) {
				return callback(err);
			}
			callback(null, doc);
		});
	},
	update: function(_id, post, callback) {
		postModel.update({
			"_id": new ObjectID(_id)
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
	remove: function(_id, callback) {
		//根据用户名、日期和标题查找并删除一篇文章
		postModel.remove({
			"_id": new ObjectID(_id)
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
	saveComment: function(_id, comment, callback) {
		postModel.update({
			"_id": new ObjectID(_id)
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