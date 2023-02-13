const XLSX = require("xlsx");
const mysql = require("mysql2");
require("dotenv").config();
// const schemaFile = "users-schema-2023-02-12T08-47-18.xlsx";
// const dataFile = "users-data-2023-02-13T10-04-27.xlsx";

const args = process.argv.slice(2);
let schemaFile, dataFile;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-s") {
    schemaFile = args[i + 1];
  } else if (args[i] === "-d") {
    dataFile = args[i + 1];
  }
}
if (!schemaFile || !dataFile) {
  return console.log(
    "Invalid information passed. Pass schema file and datafile using -s -d flag respectively"
  );
} else {
  // Connect to MySQL database
  const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  const schema = readExcel(schemaFile);
  const data = readExcel(dataFile);
  const tableName = schemaFile.split("-")[0];
  connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to MySQL");
    main();
    return connection.end();
  });

  function main() {
    if (data.length < 1) return console.log("No data in the data file");
    if (schema.length < 1) return console.log("No data in the schema file");

    // Get the column names from the first row of the data
    const columns = Object.keys(schema[0]).map(function (column) {
      return `\`${column}\` ${dataTypes[schema[0][column]] ?? "TEXT"} `;
    });

    // Create the table
    const table = tableName;
    const sql = `CREATE TABLE IF NOT EXISTS ${table} (${columns.join(", ")})`;

    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log(`Table ${table} created`);
    });

    // Insert data into MySQL
    data.forEach(function (row) {
      let sql = `INSERT INTO ${table} SET ?`;
      connection.query(sql, row, function (err, result) {
        if (err) throw err;
        console.log("Row inserted");
      });
    });
  }

  function readExcel(fileName) {
    // Reads data from Excel file
    // and returns data in json format

    const workbook = XLSX.readFile(fileName);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
  }

  var dataTypes = {
    string: "VARCHAR(1000)",
    boolean: "TINYINT(1)",
    date: "DATETIME",
    number: "DECIMAL(10,2)",
  };
}
