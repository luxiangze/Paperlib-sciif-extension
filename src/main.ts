import { PLExtAPI, PLExtension } from "paperlib-api/api";

class PaperlibExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-extension",
      defaultPreference: {},
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference,
    );
  }

  async dispose() {
    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }
}

async function initialize() {
  const extension = new PaperlibExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
