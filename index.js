import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import moment from "moment";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const hostname = 'localhost';
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b";
const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});



db.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to the database');
    }
});


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

const getCoverUrl = (key, value, size) => {
    return `${API_URL}/${key}/${value}-${size}.jpg`;
};

app.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM books ORDER BY read_date DESC');
      res.render('index', { books: result.rows, getCoverUrl });
    } catch (error) {
      console.error("Error fetching books", error.message);
      res.render('index', { books: [], getCoverUrl });
    }
});

app.post("/submit", async (req, res) => {
    const { title, author, isbn, rating, notes, read_date } = req.body;    
    try {
        await db.query(
            'INSERT INTO books (title, author, isbn, rating, notes, read_date) VALUES ($1, $2, $3, $4, $5, $6)',
            [title, author, isbn, rating, notes, read_date]
        );
        res.redirect('/');
    } catch (error) {
        console.error("Error adding book", error.message);
        res.redirect('/');
    }

});

app.post('/submit-comment', async(req, res) => {
    const{name, email, comment} = req.body
    try{
        await db.query(
            'INSERT INTO users (name, email, comment)VALUES($1,$2,$3)',
            [name,email,comment]
        );
        res.redirect('/FAQs');
    }
    catch (error) {
        console.error("Error posting Comment", error.message);
        res.redirect('/FAQs');
    }

});
app.get('/FAQs', async (req, res) => {
    try {
      const result = await db.query('SELECT name, comment FROM users ORDER BY name DESC');
      res.render('FAQs', { comments: result.rows, moment:moment});
    } catch (error) {
      console.error("Error fetching books", error.message);
      res.render('FAQs', { comments: [], moment: moment});
    }
});

app.get("/books", async (req, res) => {
    res.render("books")
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); 