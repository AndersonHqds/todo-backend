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

const Todo = new mongoose.Schema({
  content: String,
  userId: String,
  status: Boolean
})

const UserModel = mongoose.model("UserAccount", UserAccount);

const TodoModel = mongoose.model("Todo", Todo)

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
  console.log({user});
  if (user && user.length > 0 &&  bcrypt.compareSync(password, user[0].password)) {
    const token = jwt.sign({ username, id: user[0]._id }, "@4Bck7AH$3^o")
    return res.send({ token: `bearer ${token}` })
  }
  return res.status(400).send("User or password is invalid");
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
const isUserAuthenticatedMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(400).send("You need to provide the token header")
  }
  try {
    jwt.verify(token.split(" ")[1], "@4Bck7AH$3^o")
    next()
  }
  catch (error) {
    return res.status(401).send("Unauthorized")
  }


}
app.post("/todo", isUserAuthenticatedMiddleware, async (req, res) => {
  const { content } = req.body;
  const token = (req.headers as any).token;
  const tokenDecoded = jwt.decode(token.split(" ")[1]) as any;
  console.log(tokenDecoded)
  if (!content || content?.trim().length === 0) {
    return res.status(400).send("The data  is not regulized");
  }
  await TodoModel.create({content: content, userId: tokenDecoded.id , status: false });
  return res.status(201).send("Todo was created")
})




app.get("/todo", isUserAuthenticatedMiddleware, async (req, res) => {
  try {
    const token = (req.headers as any).token;
    const tokenDecoded = jwt.decode(token.split(" ")[1]) as any;
    const todos = await TodoModel.find({ userId: tokenDecoded.id }).exec();
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.patch("/todo", isUserAuthenticatedMiddleware, async (req, res) => {
  try {
    const { id, status } = req.body;
    const token = (req.headers as any).token;
    const tokenDecoded = jwt.decode(token.split(" ")[1]) as any;
    const todo = await TodoModel.findById(id).exec() as any;
    if (!id || status === undefined || typeof status !== "boolean") {
      return res.status(400).send(" You should provide an id and a boolean status");
    }
    if (todo.userId !== tokenDecoded.id){
      return res.status(403).send("You don't have permission to update that");
    }
    await TodoModel.findByIdAndUpdate(todo?._id, {$set: {status: status}} )
    return res.status(200).send("Updated");
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
})


app.listen("3001", () => {
  console.log("Listening on port 3001");
});
