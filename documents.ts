import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

export interface Document {
  title: string;
  date: string;
  documentLocation?: string;
}

export class Documents {
  private detectedDocuments: string[] = [];
  private documents: Document[] = [];

  constructor(private fiaUri: string, private documentHandler: (addedDocuments: Document[]) => void) {
    this.setup();
  }

  setup() {
    const data: { detectedDocuments: []; documents: [] } = JSON.parse(fs.readFileSync(__dirname + '/../documents.json', 'utf-8'));
    this.detectedDocuments = data.detectedDocuments;
    this.documents = data.documents;
  }

  save() {
    fs.writeFileSync(
      __dirname + '/../documents.json',
      JSON.stringify({
        detectedDocuments: this.detectedDocuments,
        documents: this.documents,
      })
    );
  }

  async refresh() {
    const { data } = await axios.get(this.fiaUri);
    const $ = cheerio.load(data);
    const self = this;

    // We will go through the last 6 detected rows.
    $('.decision-document-list .document-row')
      .slice(0, 3)
      .each(function () {
        self.add($(this).find('.title').text().trim(), $(this).find('.date-display-single').text(), $(this).find('a').attr('href'));
      });

    // Find the any documents that were not in the array before.
    const addedDocuments = this.detectAddedDocuments();
    this.documentHandler(addedDocuments);

    // Store the information we have for future use.
    this.save();
  }

  add(title: string, date: string, documentLocation?: string) {
    const document: Document = {
      title,
      date,
    };
    if (documentLocation) document.documentLocation = `https://www.fia.com${documentLocation}`;
    this.documents.push(document);
  }

  private detectAddedDocuments() {
    const unknownDocuments = [];
    for (let i = 0; i < this.documents.length; i++) {
      const document = this.documents[i];
      const key = document.title + '-' + document.date;

      if (!this.detectedDocuments.includes(key)) {
        this.detectedDocuments.push(key);
        unknownDocuments.push(document);
      }
    }
    return unknownDocuments;
  }
}

export class DocumentsPoller {
  constructor(instance: Documents, seconds: number) {
    setInterval(async function () {
      try {
        await instance.refresh();
      } catch (error) {
        // TODO: A good way to handle this error.
        console.log(error);
      }
    }, seconds * 1000);
  }
}
