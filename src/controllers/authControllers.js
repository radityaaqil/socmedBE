const { createJwtAccess, createJwtemail } = require("../lib/jwt");
const { registerService, loginService } = require('../services/authService')
const { dbCon } = require("./../connections");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const myCache = require("./../lib/cache");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

let transporter = nodemailer.createTransport({
  service : "gmail",
  auth : {
    user : "funfungoodtime@gmail.com",
    pass : "voanbrxeknnugfcw",
  },
  tls : {
    rejectUnauthorized : false,
  },
});

const hashPass = (password) => {

  let hashing = crypto
    .createHmac("sha256", "heyheyhey")
    .update(password)
    .digest("hex");
  return hashing;
};

module.exports = {
    
  register: async (req, res) => {
    try {
      const {
        data: userData,
      } = await registerService(req.body);

      let timecreated = new Date().getTime();
      const dataToken = {
        id: userData.id,
        username: userData.username,
        timecreated
      };

      let berhasil = myCache.set(userData.id, dataToken, 300);
      if(!berhasil){
        throw { message : "error caching"}
      }
      //   buat token email verified dan token untuk aksees
      const tokenAccess = createJwtAccess(dataToken);
      const tokenEmail = createJwtemail(dataToken);
      const host = process.env.NODE_ENV === 'production' ? 'http://namadomain.com' : 'http://localhost:3000'
      const link = `${host}/verified/${tokenEmail}`

      let filepath = path.resolve(__dirname, "../templates/verificationTemplate.html")

      let htmlString = fs.readFileSync(filepath, "utf-8")
      
      const template = handlebars.compile(htmlString)

      const htmlToEmail = template({ username : userData.username, link,})


      //   kirim email
      transporter.sendMail({
        from : "Echo <funfungoodtime@gmail.com>",
        to : userData.email, //email usernya
        subject : "Verify it's you!",
        // html : htmlToEmail,
        html : htmlToEmail
      })
      //   kriim data user dan token akses lagi untuk login
      res.set("x-token-access", tokenAccess);
      return res.status(200).send(userData);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  login : async (req, res) => {
    
    try {
      const { data : userData } = await loginService(req.body)
      
      const dataToken = {
        id: userData.id,
        username : userData.username,
      }

      // Token email verified dan token untuk akses
      const tokenAccess = createJwtAccess(dataToken);
      res.set("x-token-access", tokenAccess);
      console.log(tokenAccess)
      return res.status(200).send(userData);
    } catch (error) {
      console.log(error)
      return res.status(500).send({ message: error.message || error })
    }
  },
  
  keeplogin : async (req,res) => {
    const { id } = req.user;
    let conn, sql
    try {
      conn = await dbCon.promise();
      sql = `select * from users where id = ?`
      let [result] = await conn.query(sql, [id])
      return res.status(200).send(result[0])
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message : error.message || error})
    }
  },

  accountVerified: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      // sql trnasaction initialisasi atau checkpoint feature sql transaction
      // biasanya sql transaction ini digunakan pada saat manipulasi data
      await conn.beginTransaction();
      // ngecek user sudah verified atau belum
      sql = `select id from users where id = ? and isVerified = 1`;
      let [userVerified] = await conn.query(sql, [id]);
      console.log(req.user);
      if (userVerified.length) {
        // user sudah verified
        throw { message: "Your account is already verified" };
      }
      sql = `update users set ? where id = ?`;
      let updateData = {
        isVerified: 1,
      };
      await conn.query(sql, [updateData, id]);
      sql = `select id,username,isVerified,email from users where id = ?`;
      let [result] = await conn.query(sql, [id]);
      await conn.commit();
      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  sendEmailVerified: async (req, res) => {
    const { id, username, email } = req.body;
    console.log(req.body)
    try {
      //Create something unique
      let timecreated = new Date().getTime()
      const dataToken = {
        id: id,
        username: username,
        timecreated
      };

      //use node cache
      let success = myCache.set( id, dataToken, 300)
      if(!success){
        throw {message : "error caching"}
      }
      
      const tokenEmail = createJwtemail(dataToken);
      //kirim email verifikasi
      const host =
        process.env.NODE_ENV === "production"
          ? "http://namadomainfe"
          : "http://localhost:3000";
      const link = `${host}/verified/${tokenEmail}`;
      // cari path email template
      let filepath = path.resolve(__dirname, "../templates/verificationTemplate.html");
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");

      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: username,
        link,
      });
 
      await transporter.sendMail({
        from: "Echo <funfungoodtime@gmail.com>",
        to: email,
        subject: "Verify it's you!",
        html: htmlToEmail,
      });
      return res.status(200).send({ message: "Email sent successfully" });
    } catch (error) {
      console.log(error);
      return res.status(200).send({ message: error.message || error });
    }
  },

  sendEmailForgotPassword: async (req, res) => {
    const { email } = req.body;
    console.log(req.body);

    let sql, conn;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `select email, username, id from users where email = ?`;

      let [result] = await conn.query(sql, email);

      //Create something unique
      let timecreated = new Date().getTime()
      const dataToken = {
        id: result[0].id,
        username: result[0].username,
        timecreated
      };

      //use node cache
      let success = myCache.set(email, dataToken, 300)
      if(!success){
        throw {message : "error caching"}
      }
      
      const tokenEmail = createJwtemail(dataToken);
      //kirim email verifikasi
      const host =
        process.env.NODE_ENV === "production"
          ? "http://namadomainfe"
          : "http://localhost:3000";
      const link = `${host}/resetpassword/${tokenEmail}`;
      // cari path email template
      let filepath = path.resolve(__dirname, "../templates/forgotPasswordTemplate.html");
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");

      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: result[0].username,
        link,
      });
 
      await transporter.sendMail({
        from: "Echo <funfungoodtime@gmail.com>",
        to: email,
        subject: "Reset password",
        html: htmlToEmail,
      });
      conn.release();
      res.set("x-token-access", tokenEmail);
      return res.status(200).send({ message: "Email sent!" });
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(200).send({ message: error.message || error });
    }
  },

  changePassword : async (req, res) => {
    const { id } = req.user
    const { password } = req.body

    console.log(typeof password)

    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `update users set ? where id = ?`;

      let updateData = {
        password : hashPass(password)
      };

      await conn.query(sql, [updateData, id]);

      sql = `select * from users where id = ?`;

      let [result] = await conn.query(sql, id);

      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      console.log(error)
      conn.release();
      return res.status(500).send({message : error.message})
    }
  },

  verifyMe: async (req, res) => {
    const { id } = req.user;
    console.log(req.user)

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id, username, email from users where id = ?`

      let [result] = await conn.query(sql, id)
      //Create something unique
      let timecreated = new Date().getTime()
      const dataToken = {
        id: id,
        username: result[0].username,
        email: result[0].email,
        timecreated
      };

      //use node cache
      let success = myCache.set( id, dataToken, 300)
      if(!success){
        throw {message : "error caching"}
      }
      
      const tokenEmail = createJwtemail(dataToken);
      //kirim email verifikasi
      const host =
        process.env.NODE_ENV === "production"
          ? "http://namadomainfe"
          : "http://localhost:3000";
      const link = `${host}/verified/${tokenEmail}`;
      // cari path email template
      let filepath = path.resolve(__dirname, "../templates/verificationTemplate.html");
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");

      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: result[0].username,
        link,
      });
 
      await transporter.sendMail({
        from: "Echo <funfungoodtime@gmail.com>",
        to: result[0].email,
        subject: "Verify it's you!",
        html: htmlToEmail,
      });
      conn.release();
      return res.status(200).send({ message: "Email sent successfully" });
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(200).send({ message: error.message || error });
    }
  },

}