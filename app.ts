import { ChannelBot } from './discord';
import { Document, Documents, DocumentsPoller } from './documents';
import { Bound } from './util';
import config from './config';

class App {
  private discordChannel: ChannelBot;

  constructor() {
    this.discordChannel = new ChannelBot(config.DISCORD_WEBHOOK_URI);

    this.setup();
  }

  setup() {
    const URI = config.FIA_DOCUMENTS_URI;
    const instance = new Documents(URI, this.onAddedDocuments);
    new DocumentsPoller(instance, 60);
    this.discordChannel.sendMessage([
      {
        description: `Now watching ${URI} for updates.`,
      },
    ]);
  }

  @Bound
  onAddedDocuments(documentsAdded: Document[]) {
    const embeds = documentsAdded.map((document) => {
      const embed: any = {
        color: '999999',
        title: document.title,
        description: document.date,
      };

      if (document.documentLocation) embed.url = encodeURI(document.documentLocation);
      return embed;
    });

    // I could not get multiple embeds to work. We'll just send them one by one.
    // Just be careful with getting a rate limitation.
    for (let i = 0; i < embeds.length; i++) {
      this.discordChannel.sendMessage([embeds[i]]);
    }

    if (documentsAdded.length) console.log(`> Sent ${documentsAdded.length} new documents.`);
  }
}

new App();
