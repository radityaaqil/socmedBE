const jwt = require("jsonwebtoken");

module.exports = {
  createJwtAccess: (data) => {
    //   buat
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "6h" });
  },
  createJwtemail: (data) => {
    //   buat token email
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1m" });
  },
};