require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT
const cors = require("cors")
const morgan = require("morgan")
const { dbCon } = require("./src/connections");
const multer = require("multer")

//Multer
// const fileStorageEngine = multer.diskStorage({
//   destination : (req, file, cb) => {
//     cb(null, "./public/photos")
//   },
//   filename : (req, file, cb) => {
//     cb(null, Date.now() + "--" + file.originalname)
//   }
// });

// const upload = multer({storage : fileStorageEngine});

// app.post('/single', upload.single("photo"), (req, res) => {
//   console.log(req.file)
//   res.send("Single upload success")
// })

// app.post('/multiple', upload.array('photos', 4) ,(req, res) => {
//   console.log(req.files)
//   res.send("Multiple upload success")
// })

//Morgan
morgan.token("date", function (req, res) {
    return new Date().toString();
  });
app.use(
morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

//CORS
app.use(cors({
    exposedHeaders: ["x-total-count", "x-token-access"]
}));

//Middleware Log
const logMiddleware = (req, res, next) => {
    console.log(req.method, req.url, new Date().toString());
    next();
  };

//JSON
app.use(express.json());

//PARSING INCOMING REQUEST
app.use(express.urlencoded({ extended : false }))

app.use(logMiddleware);

app.use(express.static("public"));

//GET
app.get("/", (req, res) => {
    res.send("<h1>Socialmedia API ready</h1>")
})

//Auth Routes
const { authRoutes } = require("./src/routes");
app.use("/auth", authRoutes);

//Profile Routes
const { profileRoutes } = require("./src/routes");
app.use("/profile", profileRoutes);

//Photo Routes
const { photoRoutes } = require("./src/routes");
app.use("/photos", photoRoutes)

//LISTEN
app.listen(PORT, () => console.log(`App running on PORT ${PORT}`))