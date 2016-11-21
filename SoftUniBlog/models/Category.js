const mongoose = require('mongoose');

let categorySchema = mongoose.Schema({
    name: {type:String, required: true, unique:true},
    articles: [{type:mongoose.Schema.Types.ObjectId, ref: 'Article'}]
});

categorySchema.method({
    prepareDelete: function () {
        let Article = mongoose.model('Article');
        Article.find({category:this.id}).then(articles=> {
            for (let article of articles){
                article.prepareDelete();
                article.remove();
            }
        })
    }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;