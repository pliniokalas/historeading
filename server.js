const port = process.env.PORT || 8000;

const fetch = require("node-fetch");
const express = require("express");
const path = require("path");

const { db, Book } = require("./db");

const app = express();

/* ============================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

/* ============================================ */

async function getBooks() {
  const bookery = await Book.find();
  return bookery;
}

async function getOneBook(id) {
  const foundBook = await Book.findOne({ _id: id });
  return foundBook;
}

function addBook(bookForm) {
  if (!bookForm.title) 
    throw new Error("Empty book object");

  const newBook = new Book ({ ...bookForm });
  return newBook.save();
}

async function editBook(edit) {
  let changedBook = await Book.findOne({ _id: edit._id });
  // this only works if mutating every property individually...
  changedBook.readingStart = edit.readingStart;
  changedBook.readingEnd = edit.readingEnd;
  changedBook.readTime = getDays(edit.readingStart, edit.readingEnd);
  return await changedBook.save();
}

async function remBook({ id }) {
  const removedBook = await Book.findOne({ _id: id });
  removedBook.remove();
}

function getDays(from, to) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const a = new Date(from);
  const b = new Date(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utcB - utcA) / MS_PER_DAY);
}

/* ROUTES ===================================== */

// read home page
app.get("/", (req, res) => {
  res.redirect("/books");
});

// read, books page
app.get("/books", async (req, res) => {
  getBooks()
    .then((books) => res.render("allBooks.ejs", { books }))
      .catch((error) => console.log(error));
});

// create, books page
app.post("/books", async (req, res) => {
  addBook(req.body)
    .then(() => res.redirect("/books"))
    .catch((error) => console.log(error));
});

// delete, books page
app.delete("/books", async (req, res) => {
  remBook(req.body)
    .then(() => res.sendStatus(200))
    .catch((error) => console.log(error));
});

// read, details page
app.get("/books/:bookId", async (req, res) => {
  getOneBook(req.params.bookId)
    .then((book) => res.render("bookDetails.ejs", { book }))
    .catch((error) => console.log(error));
});

// update, details page
app.post("/books/:bookId", async (req, res) => {
  editBook({ _id: req.params.bookId, ...req.body })
    .then((resp) => res.redirect(`/books/${req.params.bookId}`))
    .catch((error) => console.log(error));
});

// read, add book page
app.get("/search", async (req, res) => {
  res.render("addBooks.ejs", { searchResults: [], searchString: "" });
});

// read, add book page, search
app.post("/search", async (req, res) => {
  const { searchString } = req.body;
  const keywords = searchString.split(" ");
  const query = keywords.join("+"); 
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      res.render("addBooks.ejs", { 
        searchResults: data.items || [],
        searchString
      })
    })
    .catch((error) => console.log(error));
});

// create, add searched book
app.post("/search/add", async (req, res) => {
  addBook(req.body)
    .then(() => res.redirect("/search"))
    .catch((error) => console.log(error));
});

/* =========================================== */

app.listen(port, () => {
  console.log(`Server runnign at http://localhost:${port}/`);
})
