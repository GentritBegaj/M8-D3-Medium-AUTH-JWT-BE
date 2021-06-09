import AuthorModel from "../services/authors/schema.js";
import { verifyJWT } from "./tools.js";

export const jwtAuthMiddleware = async (req, res, next) => {
  try {
    //Extract the token from the headers
    const token = req.header("Authorization").replace("Bearer ", "");

    //Verify if token is valid
    const decoded = await verifyJWT(token);

    //Check if author with ID extracted from token payload exists
    const author = await AuthorModel.findOne({
      _id: decoded._id,
    });
    if (!author) {
      throw new Error();
    }

    //Appending the author to the req:
    req.author = author;
    next();
  } catch (error) {
    console.log(error);
    const err = new Error("Please authenticate");
    err.httpStatusCode = 401;
    next(err);
  }
};

export const adminOnlyMiddleware = async (req, res, next) => {
  if (req.author && req.author.role === "Admin") next();
  else {
    const err = new Error("You need Admin privileges to perform this action");
    err.httpStatusCode = 403;
    next(err);
  }
};
