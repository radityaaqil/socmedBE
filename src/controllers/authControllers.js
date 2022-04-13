const { createJwtAccess, createJwtemail } = require("../lib/jwt");
const { registerService, loginService } = require('../services/authService')
const { dbCon } = require("./../connections");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const myCache = require("./../lib/cache");
const path = require("path");
const fs = require("fs");
const { token } = require("morgan");

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

      let filepath = path.resolve(__dirname, "../templates/templateEmailHTML.html")

      let htmlString = fs.readFileSync(filepath, "utf-8")
      
      const template = handlebars.compile(htmlString)

      const htmlToEmail = template({ username : userData.username, link,})


      //   kirim email
      transporter.sendMail({
        from : "prikitiw <funfungoodtime@gmail.com>",
        to : userData.email, //email usernya
        subject : "Tolong tolong tolong",
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
      const tokenAccess = createJwtAccess(dataToken)
      res.set("x-token-access", tokenAccess)
      return res.status(200).send(userData)
    } catch (error) {
      console.log(error)
      return res.status(500).send({ message : error.message || error})
    }
  },
  
  keeplogin : async (req,res) => {
    const { id } = req.user;
    let conn, sql
    try {
      conn = await dbCon.promise();
      sql = `select id, username, isVerified, email from users where id = ?`
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
      let filepath = path.resolve(__dirname, "../templates/templateEmailHTML.html");
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");

      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: username,
        link,
      });
 
      await transporter.sendMail({
        from: "Prikitiw <funfungoodtime@gmail.com>",
        to: email,
        subject: "tolong verifikasi tugas grade A ujian chunin",
        html: htmlToEmail,
      });
      return res.status(200).send({ message: "berhasil kirim email lagi99x" });
    } catch (error) {
      console.log(error);
      return res.status(200).send({ message: error.message || error });
    }
  },
}