const fs = require("fs");

const custom_items_list = fs.readdirSync(process.cwd()+"/items");
const custom_items = custom_items_list.map((item)=>{return require("./items/"+item)});

async function generatePackMeta(pack,basepath) {
  let template = `{
  "pack": {
    "pack_format": ${pack.version},
    "description": "${pack.description}"
  }
}`
  fs.writeFileSync(basepath+"/pack.mcmeta",template);
}

async function generateRecipe(item,basepath) {
  if (!item.crafting) return;
  if (!fs.existsSync(basepath+"/recipes")) fs.mkdirSync(basepath+"/recipes",{recursive:true});
  let template = {"type": `minecraft:crafting_${item.crafting.type === "shaped" ? "shaped" : "unshaped"}`,"pattern": item.crafting.recipe,"key": item.crafting.key,"result": {"item": "minecraft:knowledge_book"}};
  fs.writeFileSync(basepath+`/recipes/${item.id}.json`,JSON.stringify(template))
}

async function generateAdvancement(item,basepath,packdata) {
  if (!item.crafting) return;
  if (!fs.existsSync(basepath+"/advancements")) fs.mkdirSync(basepath+"/advancements",{recursive:true});
  let template = {"criteria": {"recipeunlock": {"trigger": "minecraft:recipe_unlocked","conditions": {"recipe": `${packdata.id}:${item.id}`}}},"rewards": {"function": `${packdata.id}:${item.id}/craft`}};
  fs.writeFileSync(basepath+`/advancements/${item.id}.json`,JSON.stringify(template))
} 

async function generateFunctions(item,basepath,packdata) {
  if (!fs.existsSync(basepath+"/functions/"+item.id)) fs.mkdirSync(basepath+"/functions/"+item.id,{recursive:true});
  let give = `give @p ${item.base_item}${item.nbt} 1`;
  let craft = `recipe take @s ${packdata.id}:${item.id}
  advancement revoke @s only ${packdata.id}:${item.id}
  
  clear @s minecraft:knowledge_book
  function ${packdata.id}:${item.id}/give`;
  fs.writeFileSync(basepath+`/functions/${item.id}/craft.mcfunction`,craft);
  fs.writeFileSync(basepath+`/functions/${item.id}/give.mcfunction`,give);
}

function getPackData() {
  return require("./pack.json");
}

function moveSpecialFunctions(mp,dp,packdata) {
  let mfp = mp+"/tags/functions";
  let fp = dp+"/functions";
  let init = {"values": [`${packdata.id}:init`]};
  let tick = {"values": [`${packdata.id}:main`]};
  if (!fs.existsSync(mfp)) fs.mkdirSync(mfp,{recursive:true});
  if (fs.existsSync("./functions/__init.mcfunction")) fs.writeFileSync(mfp+`/load.json`,JSON.stringify(init));
  if (fs.existsSync("./functions/__main.mcfunction")) fs.writeFileSync(mfp+`/tick.json`,JSON.stringify(tick));
  if (fs.existsSync("./functions/__init.mcfunction")) fs.copyFileSync("./functions/__init.mcfunction",fp+"/init.mcfunction");
  if (fs.existsSync("./functions/__main.mcfunction")) fs.copyFileSync("./functions/__main.mcfunction",fp+"/main.mcfunction");

}

async function moveFunctions(dp) {
  let fp = dp+"/functions";
  let funcs = fs.readdirSync(process.cwd()+"/functions").filter(((e)=>{return !e.startsWith("__")}));
  funcs.forEach((func)=>{
    fs.copyFileSync(process.cwd()+"/functions/"+func,fp+"/"+func);
  })
}

async function moveAdvancements(dp) {
  let ap = dp+"/advancements";
  let advs = fs.readdirSync(process.cwd()+"/advancements");
  advs.forEach((adv)=>{
    fs.copyFileSync(process.cwd()+"/advancements/"+adv,ap+"/"+adv);
  })
}

async function moveRecipes(dp) {
  let rp = dp+"/recipes";
  let recs = fs.readdirSync(process.cwd()+"/recipes");
  recs.forEach((rec)=>{
    fs.copyFileSync(process.cwd()+"/recipes/"+rec,rp+"/"+rec);
  })
}

async function copyFiles(bp,dp,data) {
  let mp = bp+"/data/minecraft/";
  if (fs.readdirSync(process.cwd()+"/functions").filter((e=>e.startsWith("__")))) moveSpecialFunctions(mp,dp,data);
  moveFunctions(dp);
  moveAdvancements(dp);
  moveRecipes(dp);
}

async function generatePack() {
  let packdata = getPackData();
  let basepath = "./datapack/";
  let datapath = "./datapack/data/"+packdata.id;
  if (fs.existsSync(datapath)) fs.rmSync(datapath, { recursive: true });
  fs.mkdirSync(datapath,{recursive:true});
  generatePackMeta(packdata,basepath);
  generateItems(datapath,packdata);
  copyFiles(basepath,datapath,packdata);
}

async function validateItem(item) {
  let ok = true
  if (!item.id) ok = false;
  if (!item.base_item) ok = false;
  if (!ok) {throw Error("Item Invalid")} else return;
}

async function generateItems(basepath,packdata) {
  custom_items.forEach((item)=>{
    validateItem(item);
    generateRecipe(item,basepath);
    generateAdvancement(item,basepath,packdata);
    generateFunctions(item,basepath,packdata);
  })
}

generatePack()