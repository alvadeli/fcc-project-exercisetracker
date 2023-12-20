const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

//Setup Database connection
const MONGO_URI = process.env["MONGO_URI"];
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error");
  });

//Schemas
const exerciseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    date: String,
  },
  { _id: false },
);

userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    count: Number,
    log: [exerciseSchema],
  },
  { collection: "users" },
);

//Model
const User = mongoose.model("User", userSchema);

//mount Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Get
app.get("/api/users", async (req, res) => {
  const allUsers = await User.find().select({ logs: 0, count: 0 });

  res.json(allUsers);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await User.findById(req.params._id).select({ __v: 0 });

  const from = req.query.from ? new Date(req.query.from) : undefined;
  const to = req.query.to ? new Date(req.query.to) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

  if (from !== undefined) {
    user.log = user.log.filter((ex) => new Date(ex.date) >= from);
  }

  if (to !== undefined) {
    user.log = user.log.filter((ex) => new Date(ex.date) <= to);
  }

  if (limit !== undefined) {
    user.log = user.log.slice(0, limit);
  }

  user.count = user.log.length;

  res.json(user);
});



//Post
app.post("/api/users", (req, res) => {
  console.log(req.body.username);
  let user = new User({
    username: req.body.username,
    count: 0,
  });

  user
    .save()
    .then((userData) => {
      res.json({ username: userData.username, _id: userData._id });
    })
    .catch((err) => {
      console.error(err);
      res.send(err.message);
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let id = req.params._id;
  let description = req.body.description;
  let duration = parseFloat(req.body.duration);
  let date = req.body.date != "" && req.body.date !== undefined ? new Date(req.body.date) : new Date();

  if (isNaN(date.getDate())){
    res.send("Falied to cast date")
    return;
  }

  try {
    const exerciseData = {
      description: description,
      duration: duration,
      date: date.toDateString(),
    };

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.log.push(exerciseData);
    user.count = (user.count || 0) + 1;
    await user.save();

    res.json({
      _id: id,
      username: user.username,
      date: date.toDateString(),
      duration: duration,
      description: description,
    });
  } catch (err) {
    console.error(err);
    res.send(err.message);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
