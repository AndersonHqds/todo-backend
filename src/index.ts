import express from "express";
import fs from "fs";
import mongoose from "mongoose";

mongoose
  .connect("mongodb://root:example@localhost:27017/test?authSource=admin")
  .then(() => console.log("Connected!"))
  .catch((err) => console.log(err));

const UserAccount = new mongoose.Schema({
  username: String,
  password: String,
});

const UserModel = mongoose.model("UserAccount", UserAccount);

const app = express();
app.use(express.json());

app.get("/accounts", async (req, res) => {
  const accounts = await UserModel.find({});
  console.log({ accounts });
  return res.send({ accounts });
});

app.post("/signup", async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  await UserModel.create({ username, password });
  res.send("Account created!");
});

app.listen("3001", () => {
  console.log("Listening on port 3001");
});
