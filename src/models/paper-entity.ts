import ObjectId from "bson-objectid";
import mathmltolatex from "mathml-to-latex";

import { PaperFolder, PaperTag } from "./categorizer";

export class PaperEntity {
  static schema = {
    name: "PaperEntity",
    primaryKey: "_id",
    properties: {
      id: "objectId",
      _id: "objectId",
      _partition: "string?",
      addTime: "date",

      title: "string",
      authors: "string",
      publication: "string",
      pubTime: "string",
      pubType: "int",
      doi: "string",
      arxiv: "string",
      mainURL: "string",
      supURLs: {
        type: "list",
        objectType: "string",
      },
      rating: "int",
      tags: {
        type: "list",
        objectType: "PaperTag",
      },
      folders: {
        type: "list",
        objectType: "PaperFolder",
      },
      flag: "bool",
      note: "string",
      codes: {
        type: "list",
        objectType: "string",
      },
      pages: "string",
      volume: "string",
      number: "string",
      publisher: "string",
    },
  };

  _id: ObjectId | string = "";
  id: ObjectId | string = "";
  _partition: string = "";
  addTime: Date = new Date();
  title: string = "";
  authors: string = "";
  publication: string = "";
  pubTime: string = "";
  pubType: number = 0;
  doi: string = "";
  arxiv: string = "";
  mainURL: string = "";
  supURLs: string[] = [];
  rating: number = 0;
  tags: PaperTag[] = [];
  folders: PaperFolder[] = [];
  flag: boolean = false;
  note: string = "";
  codes: string[] = [];
  pages: string = "";
  volume: string = "";
  number: string = "";
  publisher: string = "";

  [Key: string]: unknown;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  setValue(key: string, value: unknown, allowEmpty = false, format = false) {
    // Format the value
    if (format && value) {
      // 1. Check if contains Mathml
      const mathmlRegex1 = /<math\b[^>]*>([\s\S]*?)<\/math>/gm;
      const mathmlRegex2 = /<mml:math\b[^>]*>([\s\S]*?)<\/mml:math>/gm;
      const mathmlRegex3 = /<mrow\b[^>]*>([\s\S]*?)<\/mrow>/gm;

      for (const regex of [mathmlRegex1, mathmlRegex2, mathmlRegex3]) {
        if (regex.test(value as string)) {
          const mathmls = (value as string).match(regex);
          if (mathmls) {
            for (const mathml of mathmls) {
              const latex = mathmltolatex.MathMLToLaTeX.convert(
                mathml.replaceAll("mml:", "")
              );
              value = (value as string).replace(mathml, "$" + latex + "$");
            }
          }
        }
      }
    }

    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }

  initialize(entity: PaperEntity) {
    this._id = new ObjectId(`${entity._id}`);
    this.id = new ObjectId(`${entity.id}`);
    this._partition = entity._partition;
    this.addTime = entity.addTime;
    this.title = entity.title;
    this.authors = entity.authors;
    this.publication = entity.publication;
    this.pubTime = entity.pubTime;
    this.pubType = entity.pubType;
    this.doi = entity.doi;
    this.arxiv = entity.arxiv;
    this.mainURL = entity.mainURL;
    this.supURLs = JSON.parse(JSON.stringify(entity.supURLs));
    this.rating = entity.rating;
    this.tags = entity.tags.map((tag) => new PaperTag("", 0).initialize(tag));
    this.folders = entity.folders.map((folder) =>
      new PaperFolder("", 0).initialize(folder)
    );
    this.flag = entity.flag;
    this.note = entity.note;
    this.codes = JSON.parse(JSON.stringify(entity.codes));
    this.pages = entity.pages;
    this.volume = entity.volume;
    this.number = entity.number;
    this.publisher = entity.publisher;

    return this;
  }
}
