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
};

export default class Generator {
  constructor({dest, upload}) {
    this.dest = dest;
    this.upload = upload;
  }
  async targets(){
    return (await readJson(this.upload)).filter(o=>o.active).map((o)=> new services[o.service]({...o, dest:this.dest}) );
  }
}
