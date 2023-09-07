const http = require("http");
const express = require("express");
const cors = require("cors");
const { DataSource } = require("typeorm");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const express_port = 6363;

const typeorm = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
});

app.use(cors());
app.use(express.json());

const signUp = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (
      email === undefined ||
      first_name === undefined ||
      last_name === undefined ||
      password === undefined
    ) {
      const err = new Error("KEY_ERROR");
      err.statusCode = 400;
      err.message = "Missing Required Elements.";
      throw err;
    }

    if (password.length < 8) {
      const err = new Errow("PASSWORD_TOO_SHORT");
      err.statusCode = 400;
      err.message = "Password Must Be longer than 8 Characters.";
      throw err;
    }

    const checkUser = await typeorm.query(
      `SELECT id, email FROM users WHERE email ='${email}';`
    );
    if (checkUser.length > 0) {
      const err = new Error("EMAIL_ALREADY_EXIST");
      err.statusCode = 400;
      err.message = "This Email is Already in Use.";
      throw err;
    }

    const special_char = /.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|-].*/;
    if (!special_char.test(password)) {
      const err = new Error("NO_SPEICAL_CHAR_IN_PASSWORD");
      err.statusCode = 400;
      err.message = "Password Must Include Special Character";
      throw err;
    }

    const userData = await typeorm.query(
      `INSERT INTO users (first_name, last_name, email, password) VALUES ("${first_name}", "${last_name}", "${email}", "${password}");`
    );

    return res.status(200).json({ "Message" : "User Created" });
  } catch (err) {
    console.log(err);
    return res.status(err.statusCode).json({ "Message" : err.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkEmail = await typeorm.query(
      `SELECT id, password FROM users WHERE email = '${email}'`
    );

    if (email === undefined || password === undefined) {
      const err = new Error("KEY_ERRO_CHECK_CREDENTIAL");
      err.statusCode = 400;
      err.message = "Please Email or Password";
      throw err;
    }

    if ((checkEmail.length = 0)) {
      const err = new Error("CREDENTIAL_INFO_ERROR1");
      err.statusCode = 400;
      err.message = "CANNOT LOGIN, PLEASE REGISTER";
      throw err;
    }

    const checkPassword = await typeorm.query(
      `SELECT id, password FROM users WHERE password = '${password}'`
    );

    if (checkPassword[0].password !== password) {
      const error = new Error("CREDENTIAL_INFO_ERROR2");
      console.log(checkPassword[0]);
      error.statusCode = 400;
      error.message = "CANNOT LOGIN, PLEASE CHECK PW";
      throw error;
    }

    const userId = checkPassword[0].id;
    const secretKey = "ILOVEWECODE";
    const payload = { id: userId };
    const token = jwt.sign(payload, secretKey);

    return res.status(200).json({ Message: "Sign In Successful", "TOKEN" : token });
  } catch (err) {
    console.log(err);
    return res.status(err.statusCode).json({ Message: err.message });
  }
};

// API Endpoints
app.post("/signUp", signUp);

app.post("/signIn", signIn);

// Express Server Part.
const server = http.createServer(app); // express app 으로 서버를 만듭니다.
const start = async () => {
  // 서버를 시작하는 함수입니다.
  try {
    server.listen(express_port, () =>
      console.log(`Server is listening on ${express_port}`)
    );
  } catch (err) {
    console.error(err);
  }
};

typeorm.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

start();
