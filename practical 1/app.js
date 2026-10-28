const fs = require("fs");

const student = {
    name: "Vidhi",
    age: 20,
    city: "Ahmedabad"
};

fs.writeFileSync("student.json", JSON.stringify(student, null, 4));
//write file sync writes data into file
//stringify converts the object into a JSON string
console.log("JSON file created successfully");