Extracted from "minecraft-data": "3.46.2".
Some of later versions are broken for some schematics.

Code to remove unused from data.js when updating to a newer version:

const { readFileSync, writeFileSync } = require('fs')
const file = 'data.js';
const data = readFileSync(file, 'utf-8')
	.split('\n')
	.filter(line =>
		!line.startsWith('      get') ||
		['      get blocks', '      get items', '      get version'].some(valid => line.startsWith(valid))
	)
	.join('\n');
writeFileSync('data.js', data);

Remove 'bedrock' key from data.js manually