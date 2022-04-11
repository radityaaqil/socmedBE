const { writeFile } = require("fs");
// cara mengubah callback menjadi promise

module.exports = (path, isifile) => {
  return new Promise((resolve, rejects) => {
    writeFile(path, isifile, (err) => {
      if (err) {
        // kalo reject kebaca maka kodingan akna masuk catch
        rejects(err);
      }
      // klo resolve terbaca maka object akan masuk kedalam res
      resolve({ message: "berhasil" });
    });
  });
};