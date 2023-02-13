const mongoose = require("mongoose");
const json2xls = require("json2xls");
const fs = require("fs");
// fetching arguments from cli

const args = process.argv.slice(2);
let url, collectionName, database;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-d") {
    database = args[i + 1];
  } else if (args[i] === "-c") {
    collectionName = args[i + 1];
  } else if (args[i] === "-s") {
    url = args[i + 1];
  }
}

if (url.endsWith("/")) {
  url += database;
} else url += "/" + database;

if (!url || !collectionName || !database) {
  return console.log("Invalid information passed");
} else {
  // Log a message when the connection is successful
  mongoose.connect(url, { useNewUrlParser: true });
  mongoose.connection.once("open", () => {
    console.log(`Connected to MongoDB database: ${database}`);
    main();
  });

  // Log an error message if the connection fails
  mongoose.connection.on("error", (error) => {
    console.error(`Failed to connect to MongoDB database: ${error}`);
  });
}

function main() {
  // Get the model for the collection

  const model = mongoose.model(
    collectionName,
    new mongoose.Schema({}, { strict: false })
  );

  exportSchema();
  return exportMongoData();
  // Retrieve all documents in the collection

  function exportSchema() {
    model.findOne({}, (error, document) => {
      if (error) {
        console.error(error);
      } else {
        const sch = formatSchema(document.toObject());
        exportData(sch, "schema");
      }
    });
  }

  function exportMongoData() {
    model.find({}, (error, documents) => {
      if (error) {
        console.error(error);
      } else {
        const data = documents.map((d) => d.toObject());
        exportData(data, "data");
      }
    });
  }

  function exportData(data, type = "") {
    const d = new Date();
    const xls = json2xls(data);
    const fileName = `${collectionName}-${type}-${getTime()}`;
    collectionName - fs.writeFileSync(`${fileName}.xlsx`, xls, "binary");
    console.log(`Exported  ${fileName}.xlsx`);
  }

  function formatSchema(obj) {
    const sch = {};
    for (var key in obj) {
      sch[key] = typeof obj[key];
      if (typeof obj[key] == "object") {
        if (obj[key] instanceof Date) sch[key] = "date";
        if (obj[key] instanceof mongoose.Types.ObjectId) sch[key] = "ObjectId";
      }
    }
    return sch;
  }

  function getTime() {
    const date = new Date();
    let formattedDate = date.toISOString().slice(0, 10);
    formattedDate = formattedDate.replace(/[:]/g, "-");
    return formattedDate;
  }
}
