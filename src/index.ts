
/* IMPORT */

import Config from './config';
import { Enex, HTML } from './providers';
import { Options } from './types';
import Utils from './utils';

const providers = {
  enex: Enex,
  html: HTML,
};

/* DUMPER */

const Dumper = {
  async dump ( options: Options ): Promise<void> {

    if ( options.DOMParser ) Config.html2markdown.options['parser'] = options.DOMParser;

    const sources = Utils.lang.castArray ( options.source );

    for ( const source of sources ) {
      await providers[options.provider].dump ( source, options.dump );
    }

  }

};

/* EXPORT */

export default Dumper;
