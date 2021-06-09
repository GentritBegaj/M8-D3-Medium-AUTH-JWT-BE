import jwt from "jsonwebtoken";
import Author from "../services/authors/schema.js";

export const authenticate = async (author) => {
  const newAccessToken = await generateJWT({ _id: author._id });
  const newRefreshToken = await generateRefreshJWT({ _id: author._id });

  author.refreshToken = newRefreshToken;
  await author.save();

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

const generateJWT = (payload) => {
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );
};

export const verifyJWT = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      processs.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

export const refreshToken = async (oldRefreshToken) => {
  const decoded = await verifyRefreshToken(oldRefreshToken);

  const author = await Author.findOne({ _id: decoded._id });

  if (!author) {
    throw new Error("Access is denied");
  }

  const currentRefreshToken = author.refreshToken;

  if (currentRefreshToken !== oldRefreshToken) {
    throw new Error("Refresh token is wrong");
  }

  const newAccessToken = await generateJWT({ _id: author._id });
  const newRefreshToken = await generateRefreshJWT({ _id: author._id });

  author.refreshToken = newRefreshToken;
  await author.save();

  return { token: newAccessToken, refreshToken: newRefreshToken };
};
