const Category = require('mongoose').model('Category');

module.exports = {
    all: (req, res) => {
        Category.find({}).then(categories => {
            res.render('admin/category/all', {categories:categories});
        })
    },
    createGet: (req, res)=> {
        res.render('admin/category/create');
    },

    createPost: (req, res)=> {
        let createArgs = req.body;
        Category.create(createArgs).then(category => {
            res.redirect('/admin/category/all');
        })
    }
};