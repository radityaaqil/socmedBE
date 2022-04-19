const { dbCon } = require("./../connections");
const fs = require("fs");

module.exports = {
    postCaption : async (req, res) => {
      const { id } = req.user;
      const { caption } = req.body;
      let conn, sql;
        try {
          conn = await dbCon.promise().getConnection();
         
          await conn.beginTransaction();
          
          sql = `insert into post set ?`;
          let insertData = {
            caption,
            user_id:id
          };
          let [result0] = await conn.query(sql, insertData);
          sql = `select * from post where id = ?`;
          let [result] = await conn.query(sql, [result0.insertId]);
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

      editPostCaption : async (req, res) => {
        const { username } = req.user;
        const { caption, id } = req.body;
        let conn, sql;
          try {
            conn = await dbCon.promise().getConnection();
           
            await conn.beginTransaction();
            
            sql = `update post set ? where id = ?`;
            let insertData = {
              caption,
            };
            await conn.query(sql, [insertData, id]);
            sql = `select * from post where id = ?`;
            let [result] = await conn.query(sql, id);
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

      postImage : async (req, res) => {
        const { id } = req.user;
        console.log("ini req.file post image", req.files);
        const { caption } = req.files;
        let path = "/photos";
        const imagePath = caption ? `${path}/${caption[0].filename}` : null;
        console.log(imagePath)
        if (!imagePath) {
          return res.status(500).send({ message: "foto tidak ada" });
        }
        let conn, sql;
        try {
          conn = dbCon.promise();
          sql = `update post_image set ? where id = ?`;
          let updateData = {
            image: imagePath,
          };
          await conn.query(sql, [updateData, id]);
          return res.status(200).send({ message: "berhasil upload post foto" });
        } catch (error) {
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      getAllPost : async(req,res) => {
        const { id } = req.user
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();
           
          await conn.beginTransaction();

          // sql = `select group_concat(caption) as post from post`;
          sql =`select user_id, caption, fullname, username, profile_picture, updated_at from post_render order by updated_at desc`;
          let [result] = await conn.query(sql);
          return res.status(200).send(result)
        } catch (error) {
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      }
}