const fs = require("fs");

const data = fs.readFileSync("student.json");
// reads data and stores in const data
const obj = JSON.parse(data);
//json to javascropt object

console.log(obj);