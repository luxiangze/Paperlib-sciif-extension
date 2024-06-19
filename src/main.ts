import { describe } from "node:test";
import { PLAPI, PLExtAPI, PLExtension } from "paperlib-api/api";
import { PaperEntity } from "paperlib-api/model";

class PaperlibsciifExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-sciif-extension",
      defaultPreference: {
        "secretkey": {
          type: "string",
          name: "Easyscholar SecretKey",
          description: "The SecretKey get from https://www.easyscholar.cc.",
          value: "",
          order: 2,
        },
        "CCF": {
          type: "boolean",
          name: "CCF",
          description: "Show the CCF rank in the paper details panel.",
          value: false,
          order: 1,
        },
      },
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference
    );

    this.disposeCallbacks.push(
      PLAPI.uiStateService.onChanged("selectedPaperEntities", (newValues) => {
        if (newValues.value.length === 1) {
          this.getPapersci(newValues.value[0]);
        }
      })
    );
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }

    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  async getPapersci(paperEntity: PaperEntity) {

    const lang = await PLAPI.preferenceService.get("language");
    const title = lang === "zh-CN" ? "影响因子" : "IF";


    await PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
      "publicationSCIIF": {
        title: title,
        content: `N/A`,
      },
    });

    const showCCF = await PLExtAPI.extensionPreferenceService.get(this.id, "CCF");

    if (showCCF) {
      await PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
        "publicationCCF": {
          title: "CCF",
          content: `N/A`,
        },
      });
    } else {
      await PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
        "publicationCCF": undefined
      });
    }

    let scrapeURL: string = "";
    const secretKey = await PLExtAPI.extensionPreferenceService.get(this.id, "secretkey");
    const publication = encodeURIComponent(paperEntity.publication);
    if (paperEntity.publication !== "") {
      scrapeURL = `https://www.easyscholar.cc/open/getPublicationRank?secretKey=${secretKey}&publicationName=${publication}`;
    } 

    try {
      const response = await PLExtAPI.networkTool.get(
        scrapeURL,
        {},
        1,
        5000,
        true,
        true
      );
      PLAPI.logService.info(
        `Get sciif response: ${response.status}`,
        "",
        false,
        "SCIIFExt"
      );

      const parsedResponse = response.body;
      let itemList;
      if (parsedResponse.code === 200 && parsedResponse.data !== null) {
        itemList = parsedResponse.data;
      } else {
        PLAPI.logService.warn(
          "The response data is empty.",
          "",
          false,
          "SCIIFExt"
        );
        return;
      }
      const officialRank = itemList.officialRank;
      const items = officialRank.all;

      const SCIIF = {
        sciif: items.sciif ? `${items.sciif}` : 'N/A',
        sci: items.sciif ? `${items.sci}` : 'N/A',
      };



      const CCF = {
        ccf: items.ccf ? `${items.ccf}` : 'N/A',
      };

      PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
        "publicationSCIIF": {
          title: title,
          content: `${SCIIF.sci} (${SCIIF.sciif})`,
        },
      });
      
      if (showCCF) {
        PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
          "publicationCCF": {
            title: "CCF",
            content: `${CCF.ccf}`,
          },
        });
      } else {
        PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
          "publicationCCF": undefined
        });
      }
      
    } catch (err) {
      if ((err as Error).message.includes("Key错误")) {
        PLAPI.logService.warn(
          "The easyscholar SecretKey is invalid. Please check the key in the extension preference.",
          "",
          true,
          "SCIIFExt"
        );
        return;
      }

      PLAPI.logService.error(
        "Failed to get sciif.",
        err as Error,
        false,
        "SCIIFExt"
      );
    }
  }
}

async function initialize() {
  const extension = new PaperlibsciifExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
