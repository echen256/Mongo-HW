var express = require("express");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT ||3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsScraper";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/", function (req, res) {
  res.sendFile("index.html");
});

app.get("/scrape", function (req, res) {
 
  axios.get("http://blogs.sciencemag.org/pipeline/").then(function (response) {

    var $ = cheerio.load(response.data);
    $(".item-list li").each(function (i, element) {





      var article = $(this).children("article");
      var link = article.children("h2").children("a").attr('href');
      var title = article.children("h2").children("a").text();
      var body = article.children(".article__body").text();





      var existing = db.Article.find({
        title: title
      }).then(function (res) {
        if (res.length === 0) {
          db.Article.create({
            link: link,
            title: title,
            body: body
          });
        }
      });

    })
    res.send("Scrape Complete");
  });

 
});


app.get("/articles", function (req, res) {
  db.Article.find({}).populate("notes")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
    
      res.json(err);
    });
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("notes")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {

  db.Note.create(req.body.note)
    .then(function (dbNote) {

      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});


app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
