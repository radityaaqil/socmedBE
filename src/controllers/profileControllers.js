const { dbCon } = require("./../connections");
const fs = require("fs");

module.exports = {
    updateProfile : async (req, res) => {
      const { fullname, username, bio, location } = req.body;
      const { id } = req.user;
      let conn, sql;
        try {
          conn = await dbCon.promise().getConnection();
         
          await conn.beginTransaction();
 
          sql = `select id from users where id = ? and isVerified = 1`;
          let [userVerified] = await conn.query(sql, [id]);
          console.log(req.user);
          if (!userVerified.length) {
            throw { message: "Your account is not verified" };
          }

          sql = `select id from users where username = ?`;
          let [usernameMatch] = await conn.query(sql, [username]);
          console.log(req.user);
          if (usernameMatch.length) {
     
            throw { message: "Username has already been used" };
          }
          
          sql = `update users set ? where id = ?`;
          let updateData = {
            fullname : fullname,
            username : username,
            bio : bio,
            location : location,
          };
          await conn.query(sql, [updateData, id]);
          sql = `select * from users where id = ?`;
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

      addProfilePhoto: async (req, res) => {
        const { id } = req.user;
        console.log("ini req.file profile_picture", req.file);
        let path = "/photos";
        // simpan ke database '/books/book1648525218611.jpeg'
        const imagePath = req.file ? `${path}/${req.file.filename}` : null
        console.log(imagePath)
        if (!imagePath) {
          return res.status(500).send({ message: "foto tidak ada" });
        }
        let conn, sql;
        try {
          conn = dbCon.promise();
          sql = `update users set ? where id = ?`;
          let updateData = {
            profile_picture: imagePath,
          };
          await conn.query(sql, [updateData, id]);

          sql = `select * from users `
          return res.status(200).send({ message: "berhasil upload foto" });
        } catch (error) {
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      addCoverPhoto: async (req, res) => {
        const { id } = req.user;
        console.log("ini req.file cover_picture", req.file);
        let path = "/photos";
        // simpan ke database '/books/book1648525218611.jpeg'
        const imagePath = req.file ? `${path}/${req.file.filename}` : null
        console.log(imagePath)
        if (!imagePath) {
          return res.status(500).send({ message: "foto tidak ada" });
        }
        let conn, sql;
        try {
          conn = dbCon.promise();
          sql = `update users set ? where id = ?`;
          let updateData = {
            cover_picture: imagePath,
          };
          await conn.query(sql, [updateData, id]);
          return res.status(200).send({ message: "Successfully uploaded photo" });
        } catch (error) {
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      deleteCoverPhoto : async (req, res) => {
        const { id } = req.user;
        const imagePath = "";

        let conn, sql;
        try {
          conn = dbCon.promise();
          sql = `update users set ? where id = ?`;
          let updateData = {
            cover_picture: imagePath,
          };
          await conn.query(sql, [updateData, id]);
          return res.status(200).send({ message: "Photo deleted" });
        } catch (error) {
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },     
}

