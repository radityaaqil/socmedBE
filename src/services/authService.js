const { dbCon } = require("../connections");
const crypto = require("crypto");

const hashPass = (password) => {

    let hashing = crypto
      .createHmac("sha256", "heyheyhey")
      .update(password)
      .digest("hex");
    return hashing;
};

module.exports = {
    
    registerService: async (data) => {
      // TODO ALGORTIHM REGISTER:
      
      let conn, sql;
      let { username, email, password, confirmPassword } = data;
      // 1. (OPTIONAL) CEK VALIDASI PASSWORDNYA, USERNAME TIDAK BOLEH ADA SPASI
      try {
        // buat connection dari pool karena query lebih dari satu kali
        conn = await dbCon.promise().getConnection();
        // validasi spasi untuk username & password harus sama dengan confirmPassword
        let spasi = new RegExp(/ /g);
        if (spasi.test(username)) {
          // klo ada spasi masuk sini
          throw { message: "Please avoid using space character" };
        }
        if (password !== confirmPassword) {
          // klo password tidak sama dengan confirmPassword
          throw { message: "Please insert matching password" };
        }
      
      // 2. CEK APAKAH USERNAME atau email  SUDAH ADA DI DATABASE
      
        sql = `select id from users where username = ? or email = ?`;
  
      // 3. KALO ADA , THROW ERROR USERNAME atau email TELAH DIGUNAKAN
        
        let [result] = await conn.query(sql, [username, email]);
        if (result.length) {
          throw { message: "Username or email has already been used" };
        }
      
      // 4. KALA NGGAK ADA , CREATE DATA USER KE DATABASE KE TABLE USER
      // 4a. sebelum diinput kedalam table password di hashing/bcrypt

        sql = `INSERT INTO users set ?`;
        //   buat object baru
        let insertData = {
          username,
          email,
          password: hashPass(password),
          isVerified : 0,
        };
        //   req.body.password = hashPass(password)
        let [result1] = await conn.query(sql, insertData);
        
      // 5. PASTIKAN ISVERIFIED 0 BY DEFAULT.

      // 6. GET DATA USER
    
        sql = `select id,username,email from users where id = ?`;
        let [userData] = await conn.query(sql, [result1.insertId]);
        conn.release();
        return {success : true ,data : userData[0]};
      } catch (error) {
        conn.release();
        throw new Error(error.message || error)
      }
    },

        // 7. KIRIM EMAIL VERIFIKASI  DENGAN WAKTU X MENIT
        // 8. JIKA LANGSUNG LOGIN ,
        // 9. DATA USER DAN TOKEN KRIIM KE USER.  
     
    loginService : async (data) => {
      // TODO:
      // 1. login boleh pake username atau email
      let { username, email, password } = data;
      let conn, sql;
      

      try {
        // Create connection in pool
        conn = await dbCon.promise().getConnection();

      // 2. Encrypt passwordd
        password = hashPass(password);

      // 3. get data user dengan username atau email dan password
        sql = `select * from users where (username = ? or email = ?) and password = ?`;
        let [result] = await conn.query(sql, [username, email, password]);
        console.log(result);
        if (!result.length) {
          // user tidak ditemukan
          throw { message: "User not found" };
        }
        conn.release();
      // 4. Kalo user ada maka kirim data user
        return { success : true, data : result[0]}
      } catch (error) {
        conn.release();
        console.log(error);
        throw new Error(error.message || error)
      } 
    },    
}