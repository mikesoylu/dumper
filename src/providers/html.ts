
/* IMPORT */

import {NoteMetadata, Content, AttachmentMetadata} from '../types';
import Utils from '../utils';
import {AbstractProvider, AbstractNote, AbstractAttachment} from './abstract';

/* TYPES */

type NoteRaw = Buffer;
type AttachmentRaw = {
  data: string;
  mime: string;
};

const B64_REX = /data:(\w+\/\w+);base64,([^"]*)/g;

/* HTML */

class HTMLProvider extends AbstractProvider<NoteRaw, AttachmentRaw> {

  name = 'HTML';

}

class HTMLNote extends AbstractNote<NoteRaw, AttachmentRaw> {

  async getMetadata ( note: NoteRaw ): Promise<Partial<NoteMetadata>> {
    const resources:any[] = [];

    note.toString().replace(B64_REX, (_, mime: string, data: string) => {
      resources.push({
        mime: mime.trim(),
        data: data.trim()
      });
      return _;
    });

    return {
      title: Utils.format.html.inferTitle ( note.toString () ),
      attachments: Utils.lang.flatten ( await Promise.all ( resources.map ( resource => this.provider.attachment.get ( resource ) ) ) ),
    };

  }

  async formatContent ( content: Content, metadata: NoteMetadata ): Promise<string> {

    const res = content.replace(B64_REX, (_, mime, data) => {
      const hash = data.substring(0, 32);
      return `${hash}${Utils.mime.inferExtension ( mime )}`;
    });

    return Utils.format.html.convert ( res, metadata.title );

  }

}

class HTMLAttachment extends AbstractAttachment<NoteRaw, AttachmentRaw> {

  async getMetadata ( attachment: AttachmentRaw ): Promise<Partial<AttachmentMetadata>[]> {
    const hash = attachment.data.substring(0, 32);

    const metadatas: Partial<AttachmentMetadata>[] = [],
          mime = attachment.mime,
          name = `${hash}${Utils.mime.inferExtension ( attachment.mime )}`;

    if ( name ) {

      metadatas.push ({ name, mime });

    }

    return metadatas;

  }

  getContent ( attachment: AttachmentRaw ): Content {

    return attachment.data;

  }

}

/* EXPORT */

export {HTMLProvider, HTMLNote, HTMLAttachment};
export default new HTMLProvider ( HTMLNote, HTMLAttachment );
