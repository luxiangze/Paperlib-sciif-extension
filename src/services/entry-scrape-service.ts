import { PaperEntity } from "@/models/paper-entity";
import { BibTexEntryScraper } from "@/scrapers/bibtex-entry-scraper";
import { AbstractEntryScraper } from "@/scrapers/entry-scraper";
import { PaperEntityEntryScraper } from "@/scrapers/paperentity-entry-scraper";
import { PDFEntryScraper } from "@/scrapers/pdf-entry-scraper";
import { WebcontentCNKIEntryImporter } from "@/scrapers/webcontent-cnki-entry-scraper";
import { WebcontentEmbedEntryImporter } from "../scrapers/webcontent-embed-entry-scraper";
import { WebcontentGoogleScholarEntryImporter } from "../scrapers/webcontent-googlescholar-entry-scraper";
import { WebcontentIEEEEntryImporter } from "../scrapers/webcontent-ieee-entry-scraper";
import { WebcontentPDFURLEntryImporter } from "../scrapers/webcontent-pdfurl-entry-scraper";
import { ZoteroCSVEntryScraper } from "@/scrapers/zoterocsv-entry-scraper";

import { WebcontentArXivEntryImporter } from "../scrapers/webcontent-arxiv-entry-scraper";

const SCRAPER_OBJS = new Map<string, typeof AbstractEntryScraper>([
  ["pdf", PDFEntryScraper],
  ["bibtex", BibTexEntryScraper],
  ["paperentity", PaperEntityEntryScraper],
  ["zoterocsv", ZoteroCSVEntryScraper],
  ["webcontent-arxiv", WebcontentArXivEntryImporter],
  ["webcontent-googlescholar", WebcontentGoogleScholarEntryImporter],
  ["webcontent-ieee", WebcontentIEEEEntryImporter],
  ["webcontent-cnki", WebcontentCNKIEntryImporter],
  ["webcontent-pdfurl", WebcontentPDFURLEntryImporter],
  ["webcontent-embed", WebcontentEmbedEntryImporter],
]);

/**
 * EntryScrapeService transforms a data source, such as a local file, web page, etc., into a PaperEntity.*/
export class EntryScrapeService {
  constructor() {}

  async scrape(payloads: any[]): Promise<PaperEntity[]> {
    // TODO: should check valid payload structure here.
    // TODO: Chunkrun?
    const paperEntityDrafts = await Promise.all(
      payloads.map(async (payload) => {
        const paperEntityDrafts = await Promise.all(
          Array.from(SCRAPER_OBJS.values()).map(async (Scraper) => {
            return await Scraper.scrape(payload);
          })
        );
        return paperEntityDrafts.flat();
      })
    );
    return paperEntityDrafts.flat();
  }
}
