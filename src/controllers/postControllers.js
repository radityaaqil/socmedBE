const { dbCon } = require("./../connections");
const fs = require("fs");
const db = require("../connections/socialmediadb");
const moment = require('moment');

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

          await conn.beginTransaction();
          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost order by updated_at desc limit ${dbCon.escape(
            offset
          )}, ${dbCon.escape(limit)}`;
          let [result] = await conn.query(sql);

          sql = `select updated_at from getpost where postID = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultDate] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], fromnow: moment(resultDate[0].updated_at).fromNow() }; 
          }

          // console.log(result)

          //Photo
          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], photos: resultImage };
          }

          //Likes count
          sql = `select count(*) likes_count from likes where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultLikes] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], likes: resultLikes[0].likes_count };
          }

          //Already liked
          sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
          from post
          left join likes on likes.post_id = post.id
          where post.user_id = ? and post.id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultHadLiked] = await conn.query(sql, [element.userID, element.postID])
            result[i] = { ...result[i], alreadyliked: resultHadLiked[0].already_liked}
          }

          //Comments
          sql =`SELECT count(comment) as comments FROM post_comment where post_id = ?`;
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultComments] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], comments: resultComments[0].comments };
          }


          sql = `SELECT COUNT(*) as total_posts FROM post`;
          let [totalPosts] = await conn.query(sql);

          // console.log("ini result", result)

          res.set("x-total-count", totalPosts[0].total_posts);

          conn.release();
          await conn.commit();
          return res.status(200).send(result)
        } catch (error){
          console.log(error);
          conn.release();
          await conn.rollback();
          return res.status(500).send({ message: error.message || error });
        }
      },

      getPostCount : async(req,res) => {
        const { id } = req.user
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();

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

          //Time
          sql = `select updated_at from getpost where postID = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultDate] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], fromnow: moment(resultDate[0].updated_at).fromNow() }; 
          }

          sql =`select id, image from post_image where post_id = ?`;

          //Photos
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result[i] = { ...result[i], photos: resultImage };
          }

          //Likes count
          sql = `select count(*) likes_count from likes where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultLikes] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], likes: resultLikes[0].likes_count };
          }

          //Comments count
          sql =`SELECT count(comment) as comments FROM post_comment where post_id = ?`;
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultComments] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], comments: resultComments[0].comments };
          }

           //Already liked
           sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
           from post
           left join likes on likes.post_id = post.id
           where post.user_id = ? and post.id = ?`
           for (let i = 0; i < result.length; i++) {
             const element = result[i];
             const [resultHadLiked] = await conn.query(sql, [element.userID, element.postID])
             result[i] = { ...result[i], alreadyliked: resultHadLiked[0].already_liked}
           }

          console.log("ini result", result)

          await conn.commit();
          conn.release();
          return res.status(200).send(result);
        } catch (error){
          console.log(error);
          await conn.rollback();
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
          await conn.rollback();
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      deletePost : async (req,res) => {
        let { postID } = req.params

        postID = parseInt(postID);
        
        let conn = await dbCon.promise().getConnection();
        try {
          console.log("this is post id", postID)
          // jika pake connection jangan lupa di release
          await conn.beginTransaction()
          // get data dulu
          let sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result] = await conn.query(sql, postID);
          if (!result.length) {
            throw { message: "Post not found" };
          }
          //lalu delete
          sql = `delete from post_comment where post_id = ?`
          await conn.query(sql, postID)

          sql = `delete from likes where post_id = ?`
          await conn.query(sql, postID)

          sql = `delete from post_image where post_id = ?`
          await conn.query(sql, postID)

          sql = `delete from post where id = ?`;
          await conn.query(sql, postID);
        
          // if (result[0].photos) {
          //   fs.unlinkSync("./public" + result[0].photos);
          // }
          // optional boleh di get all products ulang
          
          sql = `select userID, postid, caption, fullname, username, profile_picture, updated_at, created_at from getpost order by updated_at desc`;
          let [posts] = await conn.query(sql);
          conn.release();
          await conn.commit();
          return res.status(200).send(posts);
        } catch (error) {
          conn.release();
          await conn.rollback()
          console.log(error);
          return res.status(500).send({ message: error.message || error });
        }
      },

      getUserPostDetail : async(req,res) => {
        const { postID } = req.params
        const { id } = req.user
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

          sql = `select count(*) likes_count from likes where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultLikes] = await conn.query(sql, element.postID);
            console.log("ini resultLikes", resultLikes);
            result[i] = { ...result[i], likes: resultLikes[0].likes_count };
          }
          
          sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
          from post
          left join likes on likes.post_id = post.id
          where post.user_id = ? and post.id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultHadLiked] = await conn.query(sql, [element.userID, element.postID])
            result[i] = { ...result[i], alreadyliked: resultHadLiked[0].already_liked}
          }

          console.log("ini result", result)

          await conn.commit();
          conn.release();
          return res.status(200).send(result)
        } catch (error){
          console.log(error);
          await conn.rollback();
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
          console.log(req.params, "ini req.params")
          conn = await dbCon.promise().getConnection();

          await conn.beginTransaction();
          // get datanya nya dahulu
          sql = `select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result] = await conn.query(sql, [postID]);
          if (!result.length) {
            throw { message: "Post not found" };
          }

          sql =`select image from post_image where post_id = ?`
          let [resultImage] = await conn.query(sql, postID)
          // console.log(resultImage, "images sbelum diganti")

          // hapus image
          if (imagePath.length) {
            // klo image baru ada maka hapus image lama
            if (resultImage.length) {
              for (let i = 0; i < resultImage.length; i++) {
                const element = resultImage[i].image;
                fs.unlinkSync("./public" + element);   
              }
            }
          };

          // update data
          sql = `Update post set ? where id = ?`;

          // tanda tanya untuk set harus object
          await conn.query(sql, [data, postID]);

          sql = `delete from post_image where post_id = ?`
          await conn.query(sql, postID)
     
          // sql = `Update post_image set ? where post_id = ?`; 
          sql = `insert into post_image set ?`
          // for (let i = 0; i < imagePath.length; i++) {
          //   let val = imagePath[i];
          //   let updateDataImage = {
          //     image: val,
          //   };
          //   await conn.query(sql, [updateDataImage, postID]);
          // }
          for (let i = 0; i < imagePath.length; i++) {
            let val = imagePath[i];
            let insertDataImage = {
              image: val,
              post_id: postID,
            };
            await conn.query(sql, insertDataImage);
          }
          //GET DATA POST LAGI
          sql = `select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where postID = ?`;
          let [result1] = await conn.query(sql, [postID]);

          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result1.length; i++) {
            const element = result1[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result1[i] = { ...result1[i], photos: resultImage };
          }
          console.log(result1)
          await conn.commit();
          conn.release();
          return res.send(result1);
        } catch (error) {
          // if (imagePath) {
          //   fs.unlinkSync("./public" + imagePath);
          // }
          console.log(error);
          await conn.rollback();
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },   
      
      addLikes : async (req, res) => {
        const { id } = req.user;
        let { postID } = req.params
        postID = parseInt(postID)
        let conn, sql

        try {
          conn = await dbCon.promise().getConnection()
          await conn.beginTransaction()

          sql = `select * from likes where user_id = ? and post_id = ?`
          let [result0] = await conn.query(sql, [id, postID])

          if(result0.length>=1){
            sql = `delete from likes where user_id = ? and post_id = ?`
            await conn.query(sql, [id, postID])
            console.log("unlike")
            await conn.commit();
            conn.release();
            return res.status(200).send({message : "unlike"})
          }
          
          sql = `insert into likes set ?`
          let insertLikeData = {
            user_id:id,
            post_id:postID,
          }
          await conn.query(sql, insertLikeData)

          sql = `select * from likes where user_id = ?`
          let [result] =await conn.query(sql, id)
          await conn.commit();
          conn.release();
          return res.status(200).send({message : "like"});
        } catch (error) {
          console.log(error);
          await conn.rollback();
          conn.release();
          return res.status(500).send({ message : "error brodie"});
        }
      },

      insertComments : async (req, res) => {
        const { id } = req.user
        let { postID } = req.params
        postID = parseInt(postID)
        const { comment } = req.body

        let conn, sql
        try {
          conn = await dbCon.promise().getConnection()

          sql = `insert into post_comment set ?`;
          let insertComment = {
            comment:comment,
            user_id:id,
            post_id:postID,
          }
          await conn.query(sql, [insertComment])

          sql = `select * from post_comment`
          let [commentsAll] = await conn.query(sql)
          conn.release()
          return res.status(200).send(commentsAll)
        } catch (error) {
          console.log(error)
          conn.release()
          return res.status(500).send({message: error.message})
        }
      },

      getComments : async (req, res) => {
        let { postID } = req.params
        postID = parseInt(postID)

        let conn, sql;
        try {
          conn = await dbCon.promise().getConnection();

          await conn.beginTransaction()
          sql = `select post_comment.id, post_comment.comment, post_comment.post_id, post_comment.user_id, post_comment.created_at, users.username, users.profile_picture from post_comment
          join users on users.id = post_comment.user_id
          where post_comment.post_id = ?
          order by post_comment.created_at desc`;
          let [commentPost] = await conn.query(sql, postID);

          sql = `select created_at from post_comment where post_id = ?`
          for (let i = 0; i < commentPost.length; i++) {
            const element = commentPost[i];
            const [resultDate] = await conn.query(sql, element.post_id);
            commentPost[i] = { ...commentPost[i], fromnow: moment(resultDate[0].created_at).fromNow() }; 
          }
          await conn.commit();
          conn.release();
          return res.status(200).send(commentPost)
        } catch (error) {
          await conn.rollback();
          conn.release();
          return res.status(500).send({message:error.message})
        }
      },

      getCommentsCount : async(req,res) => {
        let { postID } = req.params
        postID = parseInt(postID)
        let conn, sql
        try {
          conn = await dbCon.promise().getConnection();

          sql =`SELECT count(comment) as comments FROM post_comment where post_id = ?`;
          let [result] = await conn.query(sql, postID);
          conn.release();
          return res.status(200).send(result[0])
        } catch (error) {
          console.log(error);
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      getUserComments : async (req, res) => {
        const { id } = req.user

        let conn, sql;

        try {
          conn = await dbCon.promise().getConnection();

          await conn.beginTransaction();

          sql = `select post_comment.id, post_comment.comment, post_comment.post_id, post_comment.user_id, post_comment.created_at, users.username, users.profile_picture from post_comment
          join users on users.id = post_comment.user_id
          where post_comment.user_id = ?
          order by post_comment.created_at desc;`;
          let [result] = await conn.query(sql, id);

          sql = `select created_at from post_comment where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultDate] = await conn.query(sql, element.post_id);
            result[i] = { ...result[i], fromnow: moment(resultDate[0].created_at).fromNow() }; 
          }

          sql = `select user_id from post where id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultUser] = await conn.query(sql, element.post_id);
            result[i] = { ...result[i], postowner_id: resultUser[0].user_id }; 
          }

          sql = `select username from users where id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultUsername] = await conn.query(sql, element.postowner_id);
            result[i] = { ...result[i], postowner_username: resultUsername[0].username }; 
          }
          
          await conn.commit();
          conn.release();
          return res.status(200).send(result)
        } catch (error) {
          console.log(error)
          await conn.rollback();
          conn.release();
          return res.status(500).send({message:error.message})
        }
      },

      getUserPostMedia : async (req, res) => {
        const { id } = req.user

        let conn, sql;
        try {
          conn = await dbCon.promise().getConnection();
           
          await conn.beginTransaction();

          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost where userID = ? order by updated_at desc`;
          let [result] = await conn.query(sql, id);

          //Time
          sql = `select updated_at from getpost where postID = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultDate] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], fromnow: moment(resultDate[0].updated_at).fromNow() }; 
          }

          sql =`select id, image from post_image where post_id = ?`;

          //Photos
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            console.log("ini resultImage", resultImage);
            result[i] = { ...result[i], photos: resultImage };
          }

          //Likes count
          sql = `select count(*) likes_count from likes where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultLikes] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], likes: resultLikes[0].likes_count };
          }

          //Comments count
          sql =`SELECT count(comment) as comments FROM post_comment where post_id = ?`;
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultComments] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], comments: resultComments[0].comments };
          }

           //Already liked
           sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
           from post
           left join likes on likes.post_id = post.id
           where post.user_id = ? and post.id = ?`
           for (let i = 0; i < result.length; i++) {
             const element = result[i];
             const [resultHadLiked] = await conn.query(sql, [element.userID, element.postID])
             result[i] = { ...result[i], alreadyliked: resultHadLiked[0].already_liked}
           }

           let newArray = result.filter((val)=>{
             return val.photos.length>0
           });

          console.log("ini result", result)
          console.log("ini result", newArray)

          await conn.commit();
          conn.release();
          // return res.status(200).send(result);
          return res.status(200).send(newArray);
        } catch (error){
          console.log(error);
          await conn.rollback();
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },

      getLikedPosts : async (req,res) => {
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

          await conn.beginTransaction();
          sql =`select userID, postID, caption, fullname, username, profile_picture, updated_at, created_at from getpost order by updated_at desc limit ${dbCon.escape(
            offset
          )}, ${dbCon.escape(limit)}`;
          let [result] = await conn.query(sql);

          sql = `select updated_at from getpost where postID = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultDate] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], fromnow: moment(resultDate[0].updated_at).fromNow() }; 
          }

          // console.log(result)

          //Photo
          sql =`select id, image from post_image where post_id = ?`;

          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultImage] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], photos: resultImage };
          }

          //Likes count
          sql = `select count(*) likes_count from likes where post_id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultLikes] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], likes: resultLikes[0].likes_count };
          }

          //Already liked
          sql = `select post.id postID, post.user_id post_U_ID, post.caption, if(likes.id is null, 0 ,1) as already_liked
          from post
          left join likes on likes.post_id = post.id
          where post.user_id = ? and post.id = ?`
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultHadLiked] = await conn.query(sql, [element.userID, element.postID])
            result[i] = { ...result[i], alreadyliked: resultHadLiked[0].already_liked}
          }

          //Comments
          sql =`SELECT count(comment) as comments FROM post_comment where post_id = ?`;
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            const [resultComments] = await conn.query(sql, element.postID);
            result[i] = { ...result[i], comments: resultComments[0].comments };
          }

          let newArray = result.filter((val => {
            return val.alreadyliked == 1
          }))


          sql = `SELECT COUNT(*) as total_posts FROM post`;
          let [totalPosts] = await conn.query(sql);

          // console.log("ini result", result)

          res.set("x-total-count", totalPosts[0].total_posts);

          await conn.commit();
          conn.release();
          return res.status(200).send(newArray)
        } catch (error){
          console.log(error);
          await conn.rollback();
          conn.release();
          return res.status(500).send({ message: error.message || error });
        }
      },
}