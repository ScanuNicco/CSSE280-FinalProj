const BASE_PATH = "./public";
const { promises: fs } = require('fs');
const DATA_IN_LOCATION = "resources.json";

async function generateData() {
  var buffer = await fs.readFile(DATA_IN_LOCATION);
  var data = JSON.parse(buffer);
  var countyData = {};
  for(item of data) {
    if(item.county == null || item.county.length <= 0){
      item.county = "Online_Services";
    } else if(item.state_province != "IN"){
      item.county = "Out_Of_State";
    }
    if(!countyData.hasOwnProperty(item.county)) {
      countyData[item.county] = [];
    }
    countyData[item.county].push(item);
  }
  if(fs.exists("public/resourcesData/")) {
    await fs.rm("public/resourcesData/", { recursive: true});
  }
  fs.mkdir("public/resourcesData/");
  var countyURLS = {};
  for(county in countyData) {
    var url = "/resourcesData/" + county + ".json";
    var displayName = county + " County";
    if(county == "Out_Of_State") {
      displayName = "Out of State";
    } else if(county == "Online_Services") {
      displayName = "Online Services";
    }
    await fs.writeFile("public" + url, JSON.stringify(countyData[county]));
    countyURLS[displayName] = url;
  }
  await fs.writeFile("public/countyList.json", JSON.stringify(countyURLS));
}


Bun.serve({
  port: 8082,
  async fetch(req) {
    const filePath = BASE_PATH + new URL(req.url).pathname;
    const file = Bun.file(filePath);
    return new Response(file);
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

//generateData();
