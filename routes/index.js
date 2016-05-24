var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
var Util = require('../models/util');
var fs = require('fs');
var formidable = require('formidable');
var gm = require('gm');

var imageMagick = gm.subClass({
    imageMagick: true
});

module.exports = function(app) {
    app.get('/', function(req, res) {
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null, page, function(err, posts, total) {
            if (err) {
                posts = [];
            }
            // console.log(req.session.user);
            res.render('index', {
                title: '',
                page: page,
                isFirstPage: (page - 1) === 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //注册
    app.get('/reg', function(req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //注册提交
    app.post('/reg', function(req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        if (password === '' || password_re === '') {
            req.flash('error', '密码未输入');
            return res.redirect('/reg');
        }
        //检测两次输入的密码
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/reg');
        }
        //密码加密
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');

        User.get(req.body.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', '用户已经存在');
                return res.redirect('/reg');
            }
            User.save(name, password, req.body.email, function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功');
                res.redirect('/');
            });
        });
    });
    //登陆页面渲染
    app.get('/login', function(req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //登陆交互
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function(err, user) {
            // console.log(user);
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/login');
            }
            if (user.password !== password) {
                req.flash('error', '密码不正确');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', '登陆成功');
            res.redirect('/');
        });
    });
    //发布页面渲染
    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        // console.log(req);
        res.render('post', {
            title: '',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //发布文章
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            tags = (req.body.tag).split(','),
            m = /<img (([a-zA-Z0-9_-]*)=(["|'])([a-zA-Z0-9_-]*)\3\s*)*src=((["|'])(https|http|ftp|rtsp|mms)?:\/\/[^\s"']+(["|']))/img.exec(req.body.post)[5].replace(/"|'/mg, '');
        // console.log(m[5]);
        Post.save(currentUser.name, currentUser.head, req.body.title, tags, req.body.type, req.body.post, m, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');
        });
    });
    //个人中心页
    app.get('/account', checkLogin);
    app.get('/account', function(req, res) {
        var currentUser = req.session.user;
        User.get(currentUser.name, function(err, user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/login');
            }
            req.session.user = user;
            fs.readdir('public/images/' + currentUser.name, function(err, files) {
                res.render('account', {
                    title: '',
                    files: files,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });

    });
    //上传图片
    app.post('/imgUpload/:name', function(req, res) {
        var currentUser = req.session.user;
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = 'public/images/temp'; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.parse(req, function(err, fields, files) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/account');
            }
            var extName = ''; //后缀名
            switch (files.img.type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'png';
                    break;
                case 'image/x-png':
                    extName = 'png';
                    break;
            }
            if (extName.length === 0) {
                return;
            }
            var path = files.img.path, //获取用户上传过来的文件的当前路径
                sz = files.img.size,
                name = files.img.name,
                type = files.img.type;
            // console.log(path, sz, name, type);
            if (sz > 2 * 1024 * 1024) {
                fs.unlink(path, function() { //fs.unlink 删除用户上传的临时文件
                    res.json({
                        status: 1,
                        data: {},
                        msg: '文件大小超出2M'
                    });
                });
            } else if (type.split('/')[0] != 'image') {
                fs.unlink(path, function() {
                    res.json({
                        status: 2,
                        data: {},
                        msg: '文件格式不正确'
                    });
                });
            } else {
                imageMagick(path)
                    .resize(150, 150, '!') //加('!')强行把图片缩放成对应尺寸150*150！
                    .autoOrient()
                    .write('public/images/temp/' + name, function(err) {
                        if (err) {
                            res.json({
                                status: 0,
                                msg: '错误'
                            });
                        }
                        fs.unlink(path, function() {
                            return res.json({
                                status: 3,
                                data: {
                                    imgurl: '/images/temp/' + name,
                                    imgname: name
                                },
                                msg: '上传成功'
                            });
                        });
                    });
            }
        });
    });
    //退出
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        //清除session里面的user，实现退出
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });
    //存档
    app.get('/archive', function(req, res) {
        Post.getArchive(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //标签页面
    app.get('/tags', function(req, res) {
        Post.getTags(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //单个标签集合
    app.get('/tags/:tag', function(req, res) {
        Post.getTag(req.params.tag, function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //搜索页面
    app.get('/search', function(req, res) {
        Post.search(req.query.keyword, function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('search', {
                title: "SEARCH:" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //友情链接
    app.get('/links', function(req, res) {
        res.render('links', {
            title: '',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //获取一个用户下的所有文章
    app.get('/u/:name', function(req, res) {
        var page = parseInt(req.query.p) || 1;
        User.get(req.params.name, function(err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/');
            }

            Post.getTen(user.name, page, function(err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) === 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    //获取分类下的文章
    app.get('/p/:type', function(req, res) {
        var page = parseInt(req.query.p) || 1;
        Post.getAllTypes(function(err, type) {
            if (!type) {
                req.flash('error', '文章分类不存在！');
                return res.redirect('/');
            }
            Post.getTenByType(req.params.type, page, function(err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                // console.log((page - 1), posts.length, total);
                res.render('user', {
                    title: req.params.type,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) === 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    //进入文章页
    app.get('/post/:name/:_id', function(req, res) {
        var flag = true;
        if (!req.session.user) {
            flag = false;
        }
        Post.getOne(req.params._id, function(err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            User.getUser(req.params.name, function(err, user) {
                res.render('article', {
                    title: req.params.title,
                    post: post,
                    flag: flag,
                    user: user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    //保存评论
    app.post('/post/:name/:_id', function(req, res) {
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = 'http://cn.gravatar.com/avatar/' + email_MD5 + '?s=48';
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };

        Post.saveComment(req.params._id, comment, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功！');
            res.redirect('back');
        });
    });
    //进入编辑页
    app.get('/edit/:name/:_id', checkLogin);
    app.get('/edit/:name/:_id', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(req.params._id, function(err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //编辑文章提交
    app.post('/edit/:name/:_id', checkLogin);
    app.post('/edit/:name/:_id', function(req, res) {
        var currentUser = req.session.user;
        Post.update(req.params._id, req.body.post, function(err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url); //出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect(url); //成功！返回文章页
        });
    });
    //删除文章
    app.get('/remove/:name/:_id', checkLogin);
    app.get('/remove/:name/:_id', function(req, res) {
        var currentUser = req.session.user;
        Post.remove(req.params._id, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
        });
    });
    app.get('/api/update/account', function(req, res) {
        //console.log(req.query.basicInfoSex, req.query.birthday, req.query.maritalstatus, req.query.profession, req.query.address, req.query.nativeplace, req.query.educationexperience, req.query.sign);
        var currentUser = req.session.user;
        User.updateInfo(currentUser.name, currentUser.email, req.query.basicInfoSex, req.query.birthday, req.query.maritalstatus, req.query.profession, req.query.address, req.query.nativeplace, req.query.educationexperience, req.query.sign, function(err, user) {
            // console.log(user);
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'error'
                });
            }
            res.json({
                status: 1,
                msg: 'success',
                data: user
            });
        });
    });

    //添加文章类型
    app.get('/api/addType', function(req, res) {
        var currentUser = req.session.user;
        User.updateArticleTypes(currentUser.name, req.query.type, function(err) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'error'
                });
            }
            res.json({
                status: 1,
                msg: 'success'
            });
        });
    });
    //获取当前登陆用户的所有文章类型
    app.get('/api/getTypes', function(req, res) {
        var currentUser = req.session.user;
        User.get(currentUser.name, function(err, user) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'error'
                });
            }
            res.json({
                status: 1,
                msg: 'success',
                data: user
            });
        });
    });

    //获取所有的标签
    app.get('/api/getTags', function(req, res) {
        Post.getTags(function(err, posts) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'err'
                });
            }
            res.json({
                status: 1,
                msg: 'succ',
                data: posts
            });
        });
    });

    //浏览排行
    app.get('/api/getTop', function(req, res) {
        Post.getTopFive(null, function(err, posts) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'err'
                });
            }
            res.json({
                status: 1,
                msg: 'succ',
                data: posts
            });
        });
    });

    //更新图片和昵称
    app.get('/api/update/userPic', function(req, res) {
        var currentUser = req.session.user;
        User.updatePic(currentUser.name, req.query.head, req.query.nick, function(err, user) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'err'
                });
            }
            // fs.readFile('../public' + req.query.head, function(err, data) {
            //     var newPath = '../public/images/'+ currentUser.name;
            //     fs.writeFile(newPath, data, function(err) {
            //         if (err) {
            //             console.log(err);
            //         }
            //     });
            // });
            res.json({
                status: 1,
                msg: 'succ',
                data: user
            });
        });
    });

    //修改密码
    app.get('/api/update/password', function(req, res) {
        var currentUser = req.session.user;
        User.updatePassword(currentUser.name, req.query.password, req.query.newPassword, function(err) {
            if (err) {
                return res.json({
                    status: 0,
                    msg: 'err'
                });
            }
            res.json({
                status: 1,
                msg: 'succ',
            });
        });
    });

    app.use(function(req, res) {
        res.render('404');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录');
            res.redirect('/');
        }
        next();
    }
};