var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
// var ArticleType = require('../models/article');
var multer = require('multer');
// var Comment = require('../models/comment');


var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/images');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({
    storage: storage
});

module.exports = function(app) {
    app.get('/', function(req, res) {
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null, page, function(err, posts, total) {
            if (err) {
                posts = [];
            }
            console.log(req.session.user);
            res.render('index', {
                title: '主页',
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
            console.log(user);
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

    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            tags = (req.body.tag).split(',');
        Post.save(currentUser.name, currentUser.head, req.body.title, tags, req.body.type, req.body.post, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');
        });
    });

    app.get('/account', checkLogin);
    app.get('/account', function(req, res){
        res.render('account', {
            title: '个人中心',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        //清除session里面的user，实现退出
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });


    // app.get('/upload', checkLogin);
    // app.get('/upload', function(req, res) {
    //     res.render('upload', {
    //         title: '文件上传',
    //         user: req.session.user,
    //         success: req.flash('success').toString(),
    //         error: req.flash('error').toString()
    //     });
    // });

    // app.post('/upload', checkLogin);
    // app.post('/upload', upload.array('field1', 5), function(req, res) {
    //     req.flash('success', '文件上传成功');
    //     res.redirect('/upload');
    // });

    app.get('/archive', function(req, res) {
        Post.getArchive(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags', function(req, res) {
        Post.getTags(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

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

    app.get('/links', function(req, res) {
        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

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
                console.log((page - 1), posts.length, total);
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

    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/u/:name/:day/:title', function(req, res) {
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
        
        Post.saveComment(req.params.name, req.params.day, req.params.title, comment, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功！');
            res.redirect('back');
        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
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

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url); //出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect(url); //成功！返回文章页
        });
    });

    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
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