import {readJson} from '../lib.js';

import BitBucket from '../services/bitbucket/BitBucket.js';
import CloudFlare from '../services/cloudflare/CloudFlare.js';
import GitHub from '../services/github/GitHub.js';
import NekoWeb from '../services/nekoweb/NekoWeb.js';

const services = {
  BitBucket,
  CloudFlare,
  GitHub,
  NekoWeb,
}

export default class Publishing {

  constructor({pub, dest}) {
    this.pub = pub;
    this.dest = dest;
  }

  async services(){
    return (await readJson(this.pub)).filter(o=>o.active).map((o)=> new services[o.name]({...o, dest:this.dest}) );
  }




}
