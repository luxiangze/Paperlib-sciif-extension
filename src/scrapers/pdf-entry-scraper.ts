import fs from "fs";
import { PLAPI } from "paperlib";

import { PaperEntity } from "@/models/paper-entity";
import { eraseProtocol, getFileType, getProtocol } from "@/utils/url";

import { AbstractEntryScraper } from "./entry-scraper";
import pdfworker from "./pdfworker/worker";

export interface IPDFEntryScraperPayload {
  type: "file";
  value: string;
}

async function cmapProvider(name) {
  let buf = fs.readFileSync(__dirname + "/cmaps/" + name + ".bcmap");
  return {
    compressionType: 1,
    cMapData: buf,
  };
}

let fontCache = {};
async function standardFontProvider(filename) {
  if (fontCache[filename]) {
    return fontCache[filename];
  }
  let data = fs.readFileSync(__dirname + "/standard_fonts/" + filename);
  fontCache[filename] = data;
  return data;
}

export class PDFEntryScraper extends AbstractEntryScraper {
  constructor() {
    super();
  }

  static validPayload(payload: any): boolean {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "file"
    ) {
      return false;
    }
    if (
      (getProtocol(payload.value) === "file" ||
        getProtocol(payload.value) === "") &&
      getFileType(payload.value) === "pdf"
    ) {
      return true;
    } else {
      return false;
    }
  }
  static async scrape(
    payload: IPDFEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const paperEntityDraft = new PaperEntity(true);

    let buf = fs.readFileSync(eraseProtocol(payload.value));
    let zoteroData = await pdfworker.getRecognizerData(
      buf,
      "",
      cmapProvider,
      standardFontProvider
    );
    zoteroData.fileName = payload.value.split("/").pop();

    const headers = {
      "Content-Type": "application/json",
    };

    zoteroData.pages = zoteroData.pages.slice(0, 1);
    const dataStr = JSON.stringify(zoteroData);
    // if (dataStr.length > 1000) {
    //   headers["Content-Encoding"] = "gzip";
    // }

    const zoteroServiceResponse = await PLAPI.networkTool.post(
      "https://services.zotero.org/recognizer/recognize",
      zoteroData,
      headers,
      0,
      5000
      // dataStr.length > 1000000
    );

    const zoteroMetadata = JSON.parse(zoteroServiceResponse.body);

    if (zoteroMetadata.title) {
      paperEntityDraft.setValue("title", zoteroMetadata.title);
    }
    if (zoteroMetadata.authors) {
      const authors = zoteroMetadata.authors.map(
        (author: { firstName: string; lastName: string }) => {
          return `${author.firstName} ${author.lastName}`;
        }
      );
      paperEntityDraft.setValue("authors", authors.join(", "));
    }
    if (zoteroMetadata.arxiv) {
      paperEntityDraft.setValue("arxiv", zoteroMetadata.arxiv);
    }
    if (zoteroMetadata.doi) {
      paperEntityDraft.setValue("doi", zoteroMetadata.doi);
    }
    paperEntityDraft.setValue("mainURL", payload.value);

    return [paperEntityDraft];
  }
}
