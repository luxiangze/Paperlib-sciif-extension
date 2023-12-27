import { PLAPI, PLExtAPI, PLExtension, PLMainAPI } from "paperlib-api";

class PaperlibHelloworldExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "@future-scholars/paperlib-demo-helloworld-extension",
      defaultPreference: {
        msg: {
          type: "string",
          name: "Message",
          description: "Message to show when echo",
          value: "Hello from the extension process",
          order: 0,
        },
        signature: {
          type: "boolean",
          name: "Signature",
          description: "Show signature in the message",
          value: false,
          order: 1,
        },
        lang: {
          type: "options",
          name: "Language",
          description: "Language of the message",
          options: { en: "English", zh: "Chinese" },
          value: "en",
          order: 2,
        },
      },
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference,
    );

    this.printSomething();

    // 1. Command Extension Example
    this.registerSomeCommands();

    // 2. UI Extension Example
    this.modifyPaperDetailsPanel();

    // 3. Hook Extension Example
    this.hookSomePoints();

    // 4. New Window Extension Example
    // Please refer to the official doc.
  }

  async dispose() {
    PLExtAPI.extensionPreferenceService.unregister(this.id);

    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }
  }

  printSomething() {
    console.log("Hello world from extension!");

    console.log("PLAPI:");
    for (const key of Object.keys(PLAPI)) {
      console.log(`  ${key}`);
    }

    console.log("\nPLMainAPI:");
    for (const key of Object.keys(PLMainAPI)) {
      console.log(`  ${key}`);
    }

    console.log("\nPLExtAPI:");
    for (const key of Object.keys(PLExtAPI)) {
      console.log(`  ${key}`);
    }
  }

  registerSomeCommands() {
    // When the user choose to run the command, the PLAPI.commandService will
    // emit a "command_echo_event" event.
    // we get the message from the preference of this extension by calling PLExtAPI.extensionPreferenceService.get()
    //
    this.disposeCallbacks.push(
      PLAPI.commandService.on("command_echo_event" as any, () => {
        let msg = PLExtAPI.extensionPreferenceService.get(this.id, "msg");
        if (PLExtAPI.extensionPreferenceService.get(this.id, "signature")) {
          if (
            PLExtAPI.extensionPreferenceService.get(this.id, "lang") === "zh"
          ) {
            msg += ` - 来自 SimpleCMD 扩展`;
          } else {
            msg += ` - from SimpleCMD Extension`;
          }
        }

        PLAPI.logService.info(
          "Hello from the extension process",
          msg,
          true,
          this.id,
        );
      }),
    );

    // Register a command with event "command_echo_event".
    this.disposeCallbacks.push(
      PLAPI.commandService.registerExternel({
        id: "command_echo",
        description: "Hello from the extension process",
        event: "command_echo_event",
      }),
    );
  }

  modifyPaperDetailsPanel() {
    this.disposeCallbacks.push(
      PLAPI.uiStateService.onChanged("selectedPaperEntities", (newValues) => {
        const selectedPaperEntities = newValues.value;

        if (selectedPaperEntities.length === 0) {
          return;
        }

        if (selectedPaperEntities.length === 1) {
          const paperEntity = selectedPaperEntities[0];

          PLAPI.uiSlotService.updateSlot("paperDetailsPanelSlot1", {
            demo_section_id: {
              title: "Demo Section",
              content: `Any string here - ${Math.random()} - ${
                paperEntity.title
              }}`,
            },
          });
        }
      }),
    );
  }

  hookSomePoints() {
    this.disposeCallbacks.push(
      PLAPI.hookService.hookModify(
        "scrapeEntryBefore",
        this.id,
        "modifyPayloads",
      ),
    );
  }

  modifyPayloads(payloads: any[]) {
    PLAPI.logService.info("modifyPayloads", `${payloads}`, true, this.id);

    // Modify the payloads here
    // ...

    // Return the modified payloads
    // For modify hook, the return value should be an array of args.
    // For example, the original args array is [payloads: SomeType], then the return value should be also [payloads: SomeType]
    return [payloads];
  }
}

async function initialize() {
  const extension = new PaperlibHelloworldExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
