import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors"
import jwt from "jsonwebtoken"
type User = {
  username: string;
  password: string;
  _id: string;
}

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
app.use(cors());

app.get("/accounts", async (req, res) => {
  const accounts = await UserModel.find({});
  console.log({ accounts });
  return res.send({ accounts });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user: User[] = await UserModel.find({ username }).exec() as unknown as User[];
  if (user && bcrypt.compareSync(password, user[0].password)) {
    const token = jwt.sign({ username, id: user[0]._id }, "@4Bck7AH$3^o")
    return res.send({ token })
  }
  return res.send("User or password is invalid");
})

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (username.trim().length === 0 || password.trim().length === 0) {
    return res.status(400).send("User and password cannot be empty")
  }
  const hash = bcrypt.hashSync(password, 8);
  await UserModel.create({ username, password: hash });
  res.send("Account created!");
});

app.listen("3001", () => {
  console.log("Listening on port 3001");
});
