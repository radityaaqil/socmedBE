const { dbCon } = require("./../connections");

module.exports = {
    updateProfile : async (req, res) => {
      const { fullname, bio } = req.body;
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
          sql = `update users set ? where id = ?`;
          let updateData = {
            fullname : fullname,
            bio : bio,
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
}

