import { Router } from "express";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware, jwtAuthMiddleware } from "../../auth/index.js";
import { authenticate, refreshToken } from "../../auth/tools.js";
import AuthorModel from "./schema.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new AuthorModel(req.body);
    const { _id } = await newAuthor.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/",
  jwtAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const total = await AuthorModel.countDocuments(query.criteria);

      const authors = await AuthorModel.find(
        query.criteria,
        query.options.fields
      )
        .populate("articles")
        .sort(query.options.sort)
        .limit(query.options.limit)
        .skip(query.options.skip);

      res.send({ links: query.links("/author", total), authors });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

router.get("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.author);
  } catch (error) {
    next(error);
  }
});

router.delete("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    await req.author.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id", jwtAuthMiddleware, async (req, res, next) => {
  try {
    const author = await AuthorModel.findById(req.params.id).populate(
      "articles"
    );
    res.send(author);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// router.post("/", async (req, res, next) => {
//   try {
//     const newAuthor = new AuthorModel(req.body);
//     const author = await newAuthor.save();
//     res.status(201).send(author._id);
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// });

router.put("/:id", async (req, res, next) => {
  try {
    const modifiedAuthor = await AuthorModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedAuthor) {
      res.send(modifiedAuthor);
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

router.delete("/:id", async (req, res, next) => {
  try {
    const author = await AuthorModel.findByIdAndDelete(req.params.id);
    if (author) {
      res.status(204).send("Author deleted");
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

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await AuthorModel.checkCredentials(email, password);
    const tokens = await authenticate(author);
    res.send(tokens);
  } catch (error) {
    next(error);
  }
});

router.post("/logout", jwtAuthMiddleware, async (req, res, next) => {
  try {
    req.author.refreshToken = null;
    await req.author.save();
    res.send();
  } catch (error) {
    next(error);
  }
});

router.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken) {
    const err = new Error("Refresh token missing");
    err.httpStatusCode = 400;
    next(err);
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.send(newTokens);
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 401;
      next(err);
    }
  }
});

export default router;
