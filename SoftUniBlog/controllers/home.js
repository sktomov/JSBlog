const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Category = mongoose.model('Category');
const User = mongoose.model('User');
const Tag = mongoose.model('Tag');

module.exports = {
    index: (req, res) => {
        let page = req.params.page;
        Category.find({}).then(categories => {
                res.render('home/index', {categories: categories,});
            })
    },
    listCategoryArticles : (req, res) => {
        let id = req.params.id;

        Category.findById(id).populate('articles').then(category => {
            Tag.populate(category.articles, {path: 'author'}, (err)=>{
                if (err){
                    console.log(err.message);
                }
                res.render('home/article', {articles: category.articles})
            });
        });
    }
};