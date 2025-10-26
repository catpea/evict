import path from 'path';
import { readFile } from 'node:fs/promises';

const json = async (filePath) => JSON.parse(await readFile(filePath, 'utf-8'));

export default class Post {
  constructor(src) {
    this.src = src;
  }

  async load(){
    const location = path.join(this.src, 'index.json');
    return;
    console.log(location)
    const data = await json(location);

    for (const [propertyName, value] of Object.entries(data)){
      Object.defineProperty(this, propertyName, {
        get: ()=>value,
        enumerable: true, // Optional: makes the property show up in iterations
        configurable: false // Optional: allows the property to be changed later
      });
    }
  }


}


// "id": "poem-0001",
// "guid": "9ae05e6a-e188-42a4-8b19-6e0734962a3e",
// "title": "You Become As Flexible As Your Dance Moves",
// "description": "",
// "tags": [
//     "furkies-purrkies"
// ],
// "date": "2025-10-25T02:35:46.740Z",
// "lastmod": null,
// "weight": 64,
// "audio": "poem-0001.mp3",
// "image": "poem-0001-illustration.jpg",
// "images": null,
// "artwork": [
//     "https://catpea.com"
// ],
// "resources": null,
// "features": {
//     "video": true
// },
// "raw": true,
// "draft": false,
// "chapter": 14
