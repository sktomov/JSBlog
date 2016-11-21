const Article = require('mongoose').model('Article');
const Category = require('mongoose').model('Category');
const Tag = require('mongoose').model('Tag');
const initializedTags = require('./../models/Tag').initializeTags;

module.exports = {
    createGet: (req, res) => {
        Category.find({}).then(categories => {
            res.render('article/create', {categories: categories});
        })
    },

    createPost: (req, res) => {
        let articleArgs = req.body;

        let errorMsg = '';

        if (!req.isAuthenticated()) {
            errorMsg = 'You should be logged in to make articles!'
        } else if (!articleArgs.title) {
            errorMsg = 'Invalid title!';
        } else if (!articleArgs.content) {
            errorMsg = 'Invalid content!';
        }

        if (errorMsg) {
            res.render('article/create', {error: errorMsg});
            return;
        }

        articleArgs.author = req.user.id;
        articleArgs.tags = [];
        Article.create(articleArgs).then(article => {
                   let tagNames = articleArgs.tagNames.split(/\s+|,/).filter(tag=>{return tag});
                   initializedTags(tagNames, article.id);
                    article.prepareInsert();
                    res.redirect('/');
            });
    },
    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author tags').then(article => {
                if(!req.user){
                    res.render('article/details', {article: article, isUserAuthorized: false});
                    return;
                }
                req.user.isInRole('Admin').then(isAdmin => {
                    let isUserAuthorized = isAdmin || req.user.isAuthor(article);
                    res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized});
                });
a
        });
    },
    editGet: function (req, res) {
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;
            res.redirect('/user/login');
            return;

        }
        Article.findById(id).populate('tags').then(article =>{
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin &&!req.user.isAuthor(article)){
                    res.redirect('/');
                    return;
                }
                Category.find({}).then(categories => {
                    article.categories = categories;

                    article.tagNames = article.tags.map(tag => {return tag.name});
                    res.render('article/edit', article)
                });
            });
        });

    },
    editPost: (req, res) => {
        let id = req.params.id;
        if(!req.isAuthenticated()){
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;
            res.redirect('/user/login');
            return;

        }
        let articleArgs = req.body;
        let errorMsg = '';
        if (!articleArgs.title){
            errorMsg = 'Title must not be empty!';
        } else if(!articleArgs.content){
            errorMsg = 'Content must not be empty!';
        }
        if(errorMsg){
            res.render('article/edit', {error:errorMsg})
        }else{
            Article.findById(id).populate('category tags').then(article => {
                if(article.category.id !== articleArgs.category){
                    article.category.articles.remove(article.id);
                    article.category.save();
                }
                article.category = articleArgs.category;
                article.title = articleArgs.title;
                article.content = articleArgs.content;

                let newTagNames = articleArgs.tags.split(/\s+|,/).filter(tag =>{return tag});

                let oldTags = article.tags.filter(tag => {
                    return newTagNames.indexOf(tag.name) === -1;
                });
                for(let tag of oldTags){
                    tag.deleteArticle(article.id);
                    article.deleteTag(tag.id);
                }
                initializedTags(newTagNames, article.id);
                article.save((err) => {
                    if(err){
                        console.log(err.message);
                    }
                    Category.findById(article.category).then(category => {
                        if(category.articles.indexOf(article.id) === -1){
                            category.articles.push(article.id);
                            category.save();
                        }
                        res.redirect(`/article/details/${id}`);
                    })
                });
            });
        }

    },
    deleteGet: (req, res)=>{
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/delete/${id}`;
            req.session.returnUrl = returnUrl;
            res.redirect('/user/login');
            return;

        }
        Article.findById(id).populate('category tags').then(article => {
            let currentUser = req.user;
            currentUser.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !currentUser.isAuthor(article)){
                    res.redirect('/');
                }
                    article.tagNames = article.tags.map(tag => {return tag.name});
                    res.render('article/delete', article)

            })

        })
    },
    deletePost: (req, res) => {
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/delete/${id}`;
            req.session.returnUrl = returnUrl;
            res.redirect('/user/login');
            return;

        }

        Article.findOneAndRemove({_id:id}).populate('author').then(article => {
           article.prepareDelete();
           res.redirect('/');
        })
    }
};