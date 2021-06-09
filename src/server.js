import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import {
  badRequestErrorHandler,
  notFoundErrorHandler,
  catchAllErrorHandler,
} from "./errorHandlers.js";
import articlesRoutes from "./services/articles/index.js";
import authorsRoutes from "./services/authors/index.js";

const server = express();

const port = process.env.PORT;

server.use(cors());
server.use(express.json());
server.use("/articles", articlesRoutes);
server.use("/authors", authorsRoutes);

console.log(listEndpoints(server));

server.use(badRequestErrorHandler);
server.use(notFoundErrorHandler);
server.use(catchAllErrorHandler);

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(
    server.listen(port, () => console.log(`Server running on port ${port}`))
  )
  .catch((err) => console.log(err));
