export dp_folder="/path/to/your/datapack" # ex: /Users/retronbv/Library/Application Support/minecraft/saves/datapacks/datapacks/datapack
node . 
rm -rf "$dp_folder"
cp -r datapack "$dp_folder"