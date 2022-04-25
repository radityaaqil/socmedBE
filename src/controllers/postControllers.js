const { dbCon } = require("./../connections");
const fs = require("fs");

module.exports = {
      getAllPost : async (req,res) => {
        // const { id } = req.user
        let { page, limit } = req.query;
        // initialize offSet limit
        if (!page) {
          page = 0;
        }
        if (!limit) {
          limit = 10;
        }
        let offset = page * limit;

        // jadiin INT
        limit = parseInt(limit);

        let conn, sql
        try {
          conn = await dbCon.promise().getConnection()

          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost order by updated_at desc limit ${dbCon.escape(
            offset
          )}, ${dbCon.escape(limit)}`;
          let [result] = await conn.query(sql);

          console.log(result)

          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result[i] = { ...result[i], photos: resultImage };
          }

          sql = `SELECT COUNT(*) as total_posts FROM post`;
          let [totalPosts] = await conn.query(sql);

          console.log("ini result", result)

          res.set("x-total-count", totalPosts[0].total_posts);

          conn.release();
          return res.status(200).send(result)
        } catch (error){
          console.log(error);
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      getPostCount : async(req,res) => {
        const { id } = req.user
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();
           
          await conn.beginTransaction();

          // sql = `select group_concat(caption) as post from post`;
          sql =`SELECT count(caption) as posts FROM getpost where userID = ?`;
          let [result] = await conn.query(sql, id);
          conn.release();
          return res.status(200).send(result[0])
        } catch (error) {
          console.log(error);
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      getUserPost : async(req,res) => {
        const { id } = req.user

        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();
           
          await conn.beginTransaction();

          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where userID = ? order by updated_at desc`;
          let [result] = await conn.query(sql, id);

          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result[i] = { ...result[i], photos: resultImage };
          }

          console.log("ini result", result)

          conn.release();
          return res.status(200).send(result)
        } catch (error){
          console.log(error);
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      postCaptionImage : async (req, res) => {
        console.log("ini body", req.body.data);
        let path = "/photos";
        const data = JSON.parse(req.body.data);
        const { id } = req.user;
        const { image } = req.files;
        const imagePath = image ? image.map((val) => {
          return `${path}/${val.filename}` 
        }) : [];

        let insertData = { ...data,user_id: id };
        console.log(insertData)

        let conn, sql;
        try {
          conn = await dbCon.promise().getConnection();
          await conn.beginTransaction();
          sql = `insert into post set ?`;
          let [result1] = await conn.query(sql, insertData);
          
          // sql = `select * from post where id = ?`;
          // let [result2] = await conn.query(sql, [result1.insertId]);

          sql = `insert into post_image set ?`; 
          for (let i = 0; i < imagePath.length; i++) {
            let val = imagePath[i];
            let insertDataImage = {
              image: val,
              post_id: result1.insertId,
            };
            await conn.query(sql, insertDataImage);
          }

          sql = `select * from post`;
          let [result2] = await conn.query(sql);
          await conn.commit();
          conn.release();
          return res.status(200).send(result2);

        } catch (error) {
          conn.rollback();
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      deletePost : async (req,res) => {
        let { postID } = req.params
        
        let conn;
        try {
          
          // jika pake connection jangan lupa di release
          conn = await dbCon.promise().getConnection();
          // get data dulu
          let sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result] = await conn.query(sql, [postID]);
          if (!result.length) {
            throw { message: "Post not found" };
          }
          //lalu delete
          sql = `delete from post where id = ?`;
          await conn.query(sql, [postID]);
          
          sql = `delete from post_image where post_id = ?`
          await conn.query(sql, postID)

          // if (result[0].photos) {
          //   fs.unlinkSync("./public" + result[0].photos);
          // }
          // optional boleh di get all products ulang
          
          sql = `select userID, postid, caption, fullname, username, profile_picture, updated_at, created_at from getpost order by updated_at desc`;
          let [posts] = await conn.query(sql);
          conn.release();
          return res.status(200).send(posts);
        } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      getUserPostDetail : async(req,res) => {
        const { postID } = req.params
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();
           
          await conn.beginTransaction();

          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ? order by updated_at desc`;
          let [result] = await conn.query(sql, postID);

          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result[i] = { ...result[i], photos: resultImage };
          }

          console.log("ini result", result)

          conn.release();
          return res.status(200).send(result)
        } catch (error){
          console.log(error);
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      editPostCaptionImage : async (req, res) => {
        console.log("ini body", req.body.data);
        let path = "/photos";
        const data = JSON.parse(req.body.data);
        const { image } = req.files;
        const imagePath = image ? image.map((val) => {
          return `${path}/${val.filename}` 
        }) : [];

        let updateData = {...data};
        console.log(updateData)

        const { postID } = req.params;
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();
          // get datanya nya dahulu
          sql = `select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result] = await conn.query(sql, [postID]);
          if (!result.length) {
            throw { message: "Post not found" };
          }
          // update data
          sql = `Update post set ? where id = ?`;
          // tanda tanya untuk set harus object
          await conn.query(sql, [data, postID]);
          // setelah update hapus image
          if (imagePath) {
            // klo image baru ada maka hapus image lama
            if (result[0].photos) {
              for (let i = 0; i < result[0].photos.length; i++) {
                const element = result[0].photos[i].image;
                fs.unlinkSync("./public" + element);   
              }
            }
          }
     
          sql = `update post_image set ?`; 
          for (let i = 0; i < imagePath.length; i++) {
            let val = imagePath[i];
            let updateDataImage = {
              image: val,
            };
            await conn.query(sql, updateDataImage);
          }
          //GET DATA POST LAGI
          sql = `select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result1] = await conn.query(sql, [postID]);

          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result1[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result1[i] = { ...result1[i], photos: resultImage };
          }
          console.log(result1)
          conn.release()
          return res.send(result1);
        } catch (error) {
          // if (imagePath) {
          //   fs.unlinkSync("./public" + imagePath);
          // }
          console.log(error);
          conn.release()
          return res.status(500).send({ message: error.message || error });
        }
      },    
}