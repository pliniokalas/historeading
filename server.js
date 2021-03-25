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
  changedBook.title = edit.title; 
  changedBook.desc = edit.desc; 
  return await changedBook.save();
}

async function remBook({ id }) {
  const removedBook = await Book.findOne({ _id: id });
  removedBook.remove();
}

/* ROUTES ===================================== */

// read home page
app.get("/", (req, res) => {
  res.render("home.ejs", {});
});

// read, books page
app.get("/books", async (req, res) => {
  getBooks()
    .then((books) => res.render("main.ejs", { books, view: "books" }))
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
app.put("/books/:bookId", (req, res) => {
  editBook({ _id: req.params.bookId, ...req.body })
    .then(() => res.sendStatus(200))
    .catch((error) => console.log(error));
});

// read, add book page
app.get("/add", async (req, res) => {
  res.render("main.ejs", { view: "add", searchResults: [] });
});

// read, add book page, request from API
app.post("/add", async (req, res) => {
  // if this is a search
  if (req.body.searchString ) {
    const { searchString } = req.body;
    const keywords = searchString.split(" ");
    const query = keywords.join("+"); 
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        res.render("main.ejs", { view: "add", searchResults: data.items || [] })
      })
      .catch((error) => console.log(error));
  } else {
    addBook(req.body)
      .then(() => res.sendStatus(200))
      .catch((error) => console.log(error));
  }
});

/* =========================================== */

app.listen(port, () => {
  console.log(`Server runnign at http://localhost:${port}/`);
})
