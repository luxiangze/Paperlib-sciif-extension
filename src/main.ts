import { PLAPI, PLExtAPI, PLExtension } from "paperlib-api/api";
import { PaperEntity } from "paperlib-api/model";

class PaperlibsciifExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-sciif-extension",
      defaultPreference: {
        key:{
          type: "string",
          name: "secretKey",
          desprition: "The extension alow users to show paper's sciif by setting easyscholar SecretKey.",
          value: "",
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

    const title = lang === "zh-CN" ? "SCI影响因子" : "SCI IF";


    await PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
      "pubilicationSCIIF": {
        title: title,
        content: `N/A`,
      },
    });

    let scrapeURL: string = "";
    const secretKey = PLExtAPI.extensionPreferenceService.get(this.id, "key");
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
      const parsedResponse = response.body;

      const pubilicationSCIIF = {
        sciif: "${parsedResponse.data.offcialRank.all.sciif}",
        sci: "${parsedResponse.data.offcialRank.all.sci}",
      };

      PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
        "pubilicationSCIIF": {
          title: title,
          content: `${pubilicationSCIIF.sci} (${pubilicationSCIIF.sciif})`,
        },
      });
    } catch (err) {
      if ((err as Error).message.includes("Key错误")) {
        PLAPI.logService.warn(
          "The easyscholar SecretKey is invalid. Please check the key in the extension preference.",
          "",
          false,
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
