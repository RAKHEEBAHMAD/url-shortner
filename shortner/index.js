const express = require("express");
const app = express();
const model = require("./models/shortner");
const mongoose = require("mongoose");
const { urlencoded } = require("body-parser");
const methodOverride = require("method-override");
const validUrl = require("valid-url");

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

mongoose
  .connect("mongodb://127.0.0.1:27017/shortner")
  .then(() => {
    console.log("db connected");
  })
  .catch((error) => {
    console.log(error);
  });

app.set("view-engine", "ejs");

app.get("/", async (req, res) => {
  try {
    const allurls = await model.find();
    res.render("index.ejs", { urls: allurls, error: null });
  } catch (error) {
    res.render("index.ejs", { urls: [], error: "Error retrieving URLs" });
  }
});

app.delete("/url/:id", async (req, res) => {
  try {
    await model.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/url", async (req, res) => {
  const { fullurl } = req.body;
  if (validUrl.isWebUri(fullurl)) {
    try {
      await model.create({ full: fullurl });
      res.redirect("/");
    } catch (error) {
      res.render("index.ejs", { error: "Error saving URL", urls: [] });
    }
  } else {
    const allurls = await model.find();
    res.render("index.ejs", { error: "Invalid URL", urls: allurls });
  }
});

app.get("/:shortUrl", async (req, res) => {
  try {
    const shortUrl = await model.findOne({ short: req.params.shortUrl });
    if (!shortUrl) {
      return res.sendStatus(404);
    }

    shortUrl.clicks++;
    await shortUrl.save();
    res.redirect(shortUrl.full);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 1000, () => {
  console.log("Listening..");
});
