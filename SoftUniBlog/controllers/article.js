const Article = require('mongoose').model('Article');

module.exports = {
    createGet: (req, res) => {
        res.render('article/create');
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
        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err => {
                if (err) {
                    res.redirect('/', {error: err.message});
                } else {
                    res.redirect('/');
                }
            });
        })
    },
    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author')
            .then(article => {
                res.render('article/details', article)
            })
    },
    editGet: function (req, res) {
        let id = req.params.id;
        Article.findById(id).then(article =>{
            res.render('article/edit', article)
        });

    },
    editPost: (req, res) => {
        let id = req.params.id;
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
            Article.update({_id:id}, {$set: {title: articleArgs.title, content: articleArgs.content}}).then(updateStatus =>{
                res.redirect(`/article/details/${id}`)
            })
        }

    },
    deleteGet: (req, res)=>{
        let id = req.params.id;
        Article.findById(id).then(article => {
            res.render('article/delete', article)
        })
    },
    deletePost: (req, res) => {
        let id = req.params.id;
        Article.findOneAndRemove({_id:id}).populate('author').then(article => {
            let index = article.author.articles.indexOf(id);
            if (index<0){
                let errorMsg ='Article not found in author\'s articles!';
                res.render('article/delete', {error:errorMsg});
            }
            else {
                article.author.articles.splice(index, 1);
                article.author.save().then(user => {
                    res.redirect('/');
                })
            }
        })
    }
};