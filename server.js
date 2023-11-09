const BASE_PATH = "./public";
const { promises: fs } = require('fs');
const DATA_IN_LOCATION = "resources.json";
const PORT = "8082";

async function generateData() {
  console.log("Importing resources...");
  var buffer = await fs.readFile(DATA_IN_LOCATION);
  var data = JSON.parse(buffer);
  var dedup = [];
  console.log("Merging duplicates...")
  for(item of data){ //Deduplicate data
     
    var existIndex = getIdInSorted(dedup, item.site_id, item.agency_id);
    if(existIndex < 0) {
      var newItem = item;
      newItem.site_eligibility = [item.site_eligibility];
     
      newItem.site_schedule = [{name: item.taxonomy_name, schedule: item.site_schedule}];
      
      newItem.taxonomy_category = [item.taxonomy_category];
     
      newItem.taxonomy_code = [item.taxonomy_code];
      newItem.taxonomy_name = [item.taxonomy_name];
      newItem.nameLevel2 = [item.nameLevel2];
      newItem.nameLevel3 = [item.nameLevel3];
      newItem.nameLevel4 = [item.nameLevel4];
      newItem.nameLevel5 = [item.nameLevel5];
      dedup.push(newItem);
    } else {
      var exItem = dedup[existIndex];
      exItem.site_eligibility.pushIfNotExist(item.site_eligibility);
     
      exItem.site_schedule.pushIfNotExist({name: item.taxonomy_name, schedule: item.site_schedule});
     
      exItem.taxonomy_category.pushIfNotExist(item.taxonomy_category);
      exItem.taxonomy_code.pushIfNotExist(item.taxonomy_code);
    
      exItem.taxonomy_name.pushIfNotExist(item.taxonomy_name);
     
      exItem.nameLevel2.pushIfNotExist(item.nameLevel2);
      exItem.nameLevel3.pushIfNotExist(item.nameLevel3);
      exItem.nameLevel4.pushIfNotExist(item.nameLevel4);
      exItem.nameLevel5.pushIfNotExist(item.nameLevel5);
    }
  }
  console.log("Sorting by county...")
  var countyData = {};
  for(item of dedup) {
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
  console.log("Writing county json files...")
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

function getIdInSorted(dedup, siteId, agencyId) {
  for(var i = 0; i < dedup.length; i++) {
    if(dedup[i].agency_id == agencyId && dedup[i].site_id == siteId) {
      return i;
    }
  }
  return -1;
}

Array.prototype.pushIfNotExist = function(element) { 
  if (this.indexOf(element) < 0) {
      this.push(element);
  }
}; 


if(Bun.argv.indexOf("--genData") >= 0){
  generateData();
} else {
  console.log("Serving on port " + PORT + ".")
  Bun.serve({
    port: PORT,
    async fetch(req) {
      const filePath = BASE_PATH + (new URL(req.url).pathname == "/" ? "/index.html" : new URL(req.url).pathname);
      console.log(filePath);
      const file = Bun.file(filePath);
      var res = new Response(file);
      if(file.type.includes("json")){
        console.log("Disabling CORS on this json file")
        res.headers.set('Access-Control-Allow-Origin', '*');
      }
      return res;
    },
    error() {
      return new Response(null, { status: 404 });
    },
  });
}
