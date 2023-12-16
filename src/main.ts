import { PLAPI, PLExtAPI } from "paperlib";

import { PLExtension } from "@/models/extension";
import { EntryScrapeService } from "@/services/entry-scrape-service";

class PaperlibEntryScrapeExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  private readonly _entryScrapeService: EntryScrapeService;

  constructor() {
    super({
      id: "paperlib-entry-scrape-extension",
      name: "Entry Scrapers",
      description: "The entry scrape extension for PaperLib.",
      author: "Paperlib",
      defaultPreference: {},
    });

    this._entryScrapeService = new EntryScrapeService();

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference
    );

    this.disposeCallbacks.push(
      PLAPI.hookService.hook("scrapeEntry", this.id, "scrapeEntry")
    );
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }
    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  async scrapeEntry(payloads: any[]) {
    console.time("Scrape Entry");

    if (payloads.length === 0) {
      console.timeEnd("Scrape Entry");
      return [];
    }

    const paperEntityDrafts = await this._entryScrapeService.scrape(payloads);
    console.timeEnd("Scrape Entry");
    return paperEntityDrafts;
  }
}

async function initialize() {
  const extension = new PaperlibEntryScrapeExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
