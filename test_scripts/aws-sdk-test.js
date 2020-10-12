/**
 * http://usejsdoc.org/
 */

process.env.AWS_SDK_LOAD_CONFIG = true; 

var AWS = require("aws-sdk");

AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
  }
});
console.log("Region: ", AWS.config.region);
