import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ArticleSchema = new Schema(
  {
    headLine: String,
    subHead: String,
    content: String,
    category: {
      name: String,
      img: String,
    },
    cover: String,
    reviews: [
      {
        text: String,
        user: String,
        createdAt: Date,
        updatedAt: Date,
      },
    ],
    authors: [{ type: Schema.Types.ObjectId, required: true, ref: "Author" }],
  },

  { timestamps: true }
);

ArticleSchema.post("validate", function (err, doc, next) {
  if (error) {
    error.errorList = error.errors;
    error.httpStatusCode = 400;
    next(error); //send the error to the error handlers
  } else {
    next();
  }
});

ArticleSchema.static("findArticleWithAuthors", async function (id) {
  const article = await this.findOne({ _id: id }).populate("authors");
  return article;
});

ArticleSchema.static("findArticlesWithAuthors", async function (query) {
  const total = await this.countDocuments(query.criteria);

  const articles = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)
    .populate("authors");
  return { total, articles };
});

export default model("Article", ArticleSchema);
