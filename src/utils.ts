
/* IMPORT */

import mime2ext from 'mime2ext';
import Config from './config';
import html2markdown from './html2markdown';

/* UTILS */

const Utils = {

  lang: {

    isArray ( x ): x is any[] {

      return x instanceof Array;

    },

    isBoolean ( x ): x is boolean {

      return typeof x === 'boolean';

    },

    isString ( x ): x is string {

      return typeof x === 'string';

    },

    isBuffer ( x ): x is Buffer {

      return x instanceof Buffer;

    },

    isDateValid ( x ): x is Date {

      return x instanceof Date && !isNaN ( x.getTime () );

    },

    castArray<T> ( x: T | T[] ): T[] {

      return Utils.lang.isArray ( x ) ? x : [x];

    },

    flatten<T> ( x: T[][] ): T[] {

      return [].concat.apply ( [], x );

    },

    matchAll: ( str: string, re: RegExp ): RegExpMatchArray[] => {

      return Array.from ( str.matchAll ( re ) );

    },

    atob: (b64Encoded:string) => {
      try {
        return atob(b64Encoded);
      } catch (err) {
        return Buffer.from(b64Encoded, 'base64');
      }
    }
  },

  mime: {

    inferExtension ( type: string ): string {

      const ext = mime2ext ( type );

      return ext ? `.${ext}` : '';

    },

    isImage ( type: string ): boolean {

      return type.includes ( 'image' );

    }

  },

  format: {

    txt: {

      inferTitle ( content: string ): string | undefined {

        const firstUnemptyLine = content.match ( /^.*?\S.*$/m );

        if ( firstUnemptyLine ) return firstUnemptyLine[0].trim ();

      }

    },

    markdown: {

      inferTitle ( content: string ): string | undefined {

        const headingMatch = content.match ( /^\s{0,3}#+\s(.*)(\s#+\s*$)?/m );

        if ( headingMatch ) return headingMatch[1].trim ();

      }

    },

    html: {

      inferTitle ( content: string ): string | undefined {

        const headingMatch = content.match ( /<h1(?:\s[^>]*)?>(.*?)<\/h1>/i );

        if ( headingMatch ) return headingMatch[1].trim ();

        const titleMatch = content.match ( /<title(?:\s[^>]*)?>(.*?)<\/title>/i );

        if ( titleMatch ) return titleMatch[1].trim ();

      },

      ensureTitle ( content: string, title: string ): string {

        const headingMatch = content.match ( /<h1(?:\s[^>]*)?>(.*?)<\/h1>/i );

        if ( headingMatch ) return content;

        const titleTag = `<h1>${title}</h1>`,
              bodyIndex = content.indexOf ( '<body>' );

        if ( bodyIndex >= 0 ) {

          return `${content.substring ( 0, bodyIndex )}${titleTag}${content.substring ( bodyIndex )}`;

        } else {

          return `${titleTag}${content}`;

        }

      },

      convert ( content: string, title?: string ): string {

        title = title || Utils.format.html.inferTitle ( content );

        if ( title ) content = Utils.format.html.ensureTitle ( content, title );

        return html2markdown ( content, Config.html2markdown.options );

      }

    }

  }

};

/* EXPORT */

export default Utils;
