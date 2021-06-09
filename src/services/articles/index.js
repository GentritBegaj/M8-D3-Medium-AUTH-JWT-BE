import { Router } from "express";
import q2m from "query-to-mongo";
import ArticleModel from "./schema.js";
import AuthorModel from "../authors/schema.js";
import ReviewModel from "../reviews/schema.js";
import mongoose from "mongoose";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const { total, articles } = await ArticleModel.findArticlesWithAuthors(
      query
    );
    res.send({ links: query.links("/articles", total), articles });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const article = await ArticleModel.findArticleWithAuthors(req.params.id);
    if (article) {
      res.send(article);
    } else {
      const error = new Error("Article not found");
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const newArticle = new ArticleModel(req.body);
    const article = await newArticle.save();
    article.authors.forEach(async (author) => {
      await AuthorModel.findByIdAndUpdate(
        { _id: author },
        {
          $push: {
            articles: article._id,
          },
        },
        { runValidators: true, new: true }
      );
    });
    res.status(201).send(article._id);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const article = await ArticleModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (article) {
      res.send(article);
    } else {
      const error = new Error(`Article with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const article = await ArticleModel.findByIdAndDelete(req.params.id);
    if (article) {
      res.send("Article deleted!");
    } else {
      const error = new Error(`Article with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    next(err);
  }
});

router.get("/:articleId/reviews", async (req, res, next) => {
  try {
    const reviews = await ArticleModel.findById(req.params.articleId, {
      reviews: 1,
      _id: 0,
    });
    res.send(reviews);
  } catch (err) {
    next(err);
  }
});

router.get("/:articleId/reviews/:reviewId", async (req, res, next) => {
  try {
    const { reviews } = await ArticleModel.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.articleId),
      }, //QUERY
      {
        reviews: {
          $elemMatch: { _id: mongoose.Types.ObjectId(req.params.reviewId) },
        },
      }
    ); // PROJECTION, elemMatch is a projection operator
    if (reviews && reviews.length > 0) {
      res.send(reviews[0]);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/:articleId", async (req, res, next) => {
  try {
    const newReview = new ReviewModel(req.body);
    const review = await newReview.save();

    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      req.params.articleId,
      {
        $push: {
          reviews: review,
        },
      },
      { runValidators: true, new: true }
    );
    res.send(review);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.delete("/:articleId/reviews/:reviewId", async (req, res, next) => {
  try {
    console.log("HEREEEE");
    const modifiedArticle = await ArticleModel.findByIdAndUpdate(
      req.params.articleId,
      {
        $pull: {
          reviews: { _id: mongoose.Types.ObjectId(req.params.reviewId) },
        },
      },
      { new: true }
    );
    res.send(modifiedArticle);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put("/:articleId/reviews/:reviewId", async (req, res, next) => {
  try {
    const modifiedArticle = await ArticleModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(req.params.articleId),
        "reviews._id": mongoose.Types.ObjectId(req.params.reviewId),
      },
      {
        $set: {
          "reviews.$": {
            ...req.body,
            _id: req.params.reviewId,
            updatedAt: new Date(),
          },
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedArticle) {
      res.send(modifiedArticle);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

export default router;
