const mongoose = require("mongoose");

const fs = require("fs");
const rawdata = fs.readFileSync("secret.json");
const { url } = JSON.parse(rawdata);

mongoose.connect(url, { 
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("Database connected!"));
db.on("error", (error) => console.log(error));

const Schema = mongoose.Schema;
const bookSchema = new Schema({
  id: String,
  title: String,
  authors: String,
  publisher: String,
  pageCount: String,
  language: String,
  thumbnail: String,
});

const Book = mongoose.model("Book", bookSchema);

module.exports = {
  Book: Book,
  db: db,
};
