const _ = require("lodash");
const encryptionhelper = require("../helper/encryption");

exports.apiDecryption = (req, res, next) => {
  try {
    var encodedString;
    if (!_.isEmpty(req.body)) {
      console.log(
        "body encripted:",
        encryptionhelper.encrypt(JSON.stringify(req.body))
      );
      encodedString = req.body.details;
      if (_.isEmpty(encodedString)) {
        const response = {
          response_temp: { status: false, message: "details is required" },
          response: encryptionhelper.encrypt(
            JSON.stringify({ status: false, message: "details is required" })
          ),
        };
        return res.status(401).send(response);
      }
      req.body = JSON.parse(encryptionhelper.decrypt(encodedString));
      console.log("body decripted:", req.body);
    } else if (!_.isEmpty(req.query)) {
      console.log(
        "query encripted:",
        encryptionhelper.encrypt(JSON.stringify(req.query))
      );
      encodedString = req.query.details;
      if (_.isEmpty(encodedString)) {
        const response = {
          response_temp: { status: false, message: "details is required" },
          response: encryptionhelper.encrypt(
            JSON.stringify({ status: false, message: "details is required" })
          ),
        };
        return res.status(401).send(response);
      }
      req.query = JSON.parse(encryptionhelper.decrypt(encodedString));
      console.log("query decripted:", req.query);
    }

    next();
  } catch (error) {
    console.log(error);
    // Encrypt the entire object
    const response = {
      response_temp: { status: false, message: "Something went wrong!" },
      response: encryptionhelper.encrypt(
        JSON.stringify({ status: false, message: "Something went wrong!" })
      ),
    };
    return res.status(500).send(response);
  }
};
