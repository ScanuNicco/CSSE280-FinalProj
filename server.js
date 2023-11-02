const BASE_PATH = "./public";
const { promises: fs } = require('fs');
const DATA_IN_LOCATION = "resources.json";

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
      newItem.site_elgibility = [item.site_elgibility];
      newItem.taxonomy_category = [item.taxonomy_category];
      newItem.taxonomy_code = [item.taxonomy_code];
      newItem.taxonomy_name = [item.taxonomy_name];
      newItem.site_schedule = [item.site_schedule];
      newItem.nameLevel2 = [item.nameLevel2];
      newItem.nameLevel3 = [item.nameLevel3];
      newItem.nameLevel4 = [item.nameLevel4];
      newItem.nameLevel5 = [item.nameLevel5];
      dedup.push(newItem);
    } else {
      var exItem = dedup[existIndex];
      exItem.site_elgibility.push(item.site_elgibility);
      exItem.site_schedule.push(item.site_schedule);
      exItem.taxonomy_category.push(item.taxonomy_category);
      exItem.taxonomy_code.push(item.taxonomy_code);
      exItem.taxonomy_name.push(item.taxonomy_name);
      exItem.nameLevel2.push(item.nameLevel2);
      exItem.nameLevel3.push(item.nameLevel3);
      exItem.nameLevel4.push(item.nameLevel4);
      exItem.nameLevel5.push(item.nameLevel5);
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
