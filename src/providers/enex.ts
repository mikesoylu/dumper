
/* IMPORT */
import { md5 } from 'hash-wasm';
import {parse as xml2js} from 'fast-xml-parser';
import {AttachmentMetadata, NoteMetadata, Content} from '../types';
import Utils from '../utils';
import {AbstractProvider, AbstractNote, AbstractAttachment} from './abstract';

/* TYPES */

type XML = any;
type NoteRaw = XML;
type AttachmentRaw = XML;

/* ENEX */

class EnexProvider extends AbstractProvider<NoteRaw, AttachmentRaw> {

  name = 'Evernote';

  getNotesRaw ( content: Content ): NoteRaw[] {

    return Utils.lang.castArray ( xml2js ( content )['en-export'].note );

  }

}

class EnexNote extends AbstractNote<NoteRaw, AttachmentRaw> {

  async getMetadata ( note: NoteRaw ): Promise<Partial<NoteMetadata>> {

    const resources = note.resource ? Utils.lang.castArray ( note.resource ).filter ( resource => !!resource && !!resource.data ) : [];

    return {
      title: note.title || Utils.format.html.inferTitle ( note.content || '' ),
      tags: note.tag && Utils.lang.castArray ( note.tag ),
      attachments: Utils.lang.flatten ( await Promise.all ( resources.map ( resource => this.provider.attachment.get ( resource ) ) ) ),
      created: note.created && this.parseDate ( note.created ),
      modified: note.updated && this.parseDate ( note.updated ),
      sourceUrl: note['note-attributes'] && note['note-attributes']['source-url']
    };

  }

  parseDate ( date: string ): Date { // From the YYYYMMDDTHHMMSSZ format

    const chars = date.split ( '' );

    chars.splice ( 13, 0, ':' );
    chars.splice ( 11, 0, ':' );
    chars.splice ( 6, 0, '-' );
    chars.splice ( 4, 0, '-' );

    return new Date ( chars.join ( '' ) );

  }

  getContent ( note: NoteRaw ): Content {

    return note.content || '';

  }

  formatTags ( content: string, tags: string[] ): string {

    return `${content.trim ()}\n\n#${tags.join(" #")}`;

  }

  formatContent ( content: Content, metadata: NoteMetadata ): Content {

    let str = Utils.format.html.convert ( content.toString (), metadata.title );

    if ( metadata.tags?.length > 0 ) str = this.formatTags ( str, metadata.tags );

    return str;

  }

}

class EnexAttachment extends AbstractAttachment<NoteRaw, AttachmentRaw> {

  async getMetadata ( attachment: AttachmentRaw ): Promise<Partial<AttachmentMetadata>[]> {
    const hash = await md5( Utils.lang.atob( attachment.data ) );

    const metadatas: Partial<AttachmentMetadata>[] = [],
          mime = attachment.mime,
          name = `${hash}${Utils.mime.inferExtension ( attachment.mime )}`;

    if ( name ) {

      metadatas.push ({ name, mime });

    }

    if ( attachment.recognition ) {

      const recognition = xml2js ( attachment.recognition, { ignoreAttributes: false } );

      if ( recognition.recoIndex && recognition.recoIndex['@_objID'] ) {

        const ext = Utils.mime.inferExtension ( attachment.mime ),
              name = `${recognition.recoIndex['@_objID']}${ext}`;

        metadatas.push ({ name, mime });

      }

    }

    return metadatas;

  }

  getContent ( attachment: AttachmentRaw ): Content {

    return attachment.data;

  }

}

/* EXPORT */

export {EnexProvider, EnexNote, EnexAttachment};
export default new EnexProvider ( EnexNote, EnexAttachment );
