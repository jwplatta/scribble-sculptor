import { App, Modal, Editor, TextAreaComponent, ButtonComponent, DropdownComponent, SliderComponent, TextComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';
import { OpenAIModels } from 'OpenAIModels';

class ExecutingGPTPromptModal extends Modal {
  prompt: string
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  numberOfCompletions: number;

  constructor(
    app: App,
    editor: Editor,
    prompt: string,
    selectedModel: string,
    temperature: number,
    maxTokens: number,
    frequencyPenalty: number,
    presencePenalty: number,
    numberOfCompletions: number,
    textCompletion: OpenAITextCompletion
  ) {

    super(app);
    this.app = app;
    this.editor = editor;
    this.textCompletion = textCompletion;
    this.prompt = prompt;
    this.selectedModel = selectedModel;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.frequencyPenalty = frequencyPenalty;
    this.presencePenalty = presencePenalty;
    this.numberOfCompletions = numberOfCompletions;
  }

  onOpen(): void {
    const {contentEl} = this;
    contentEl.createEl("p", { "text": "Executing prompt..." })

    this.textCompletion.post(
      this.prompt,
      this.maxTokens,
      this.selectedModel,
      this.temperature,
      this.frequencyPenalty,
      this.presencePenalty,
      this.numberOfCompletions
    ).then((completion) => {
      this.close()
      this.editor.replaceRange(completion.trim(), this.editor.getCursor());
    })
  }

  onClose(): void {
    const {contentEl} = this;
    contentEl.empty();
  }
}


export class ExecuteGPTPromptDialogue extends Modal {
  prompt: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;
  models: OpenAIModels;
  modelNames: Array<string>;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  numberOfCompletions: number;

  constructor(app: App, editor: Editor, prompt: string, models: OpenAIModels, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.editor = editor;
    this.textCompletion = textCompletion;
    this.prompt = prompt;
    this.models = models;
    this.selectedModel = "text-davinci-003";
    this.temperature = 0.0;
    this.maxTokens = 256;
    this.frequencyPenalty = 0.0;
    this.presencePenalty = 0.0;
    this.numberOfCompletions = 1;
  }

  async getModels() {
    const modelList = await this.models.get()
    return modelList;
  }

  onOpen(): void {
    const {contentEl} = this;
    contentEl.setAttr("class", "scribble-sculptor-modal");

    contentEl.createEl("p", { text: "Prompt" });

    const promptTextArea = new TextAreaComponent(contentEl);
    promptTextArea.setValue(this.prompt);
    promptTextArea.inputEl.style.width = "100%";
    promptTextArea.inputEl.style.height = "10rem";
    promptTextArea.onChange((value) => {
      this.prompt = value;
    });

    const modelDiv = contentEl.createDiv();
    modelDiv.createEl("p", { text: "Select model" });
    const modelDropdown = new DropdownComponent(modelDiv);
    modelDropdown.onChange((value) => {
      this.selectedModel = value;
    })

    this.getModels().then((modelList) => {
      const modelNames = modelList.map((model: any) => model.id)
      modelNames.forEach((name: string) => {
        modelDropdown.addOption(name, name);
      });

      modelDropdown.setValue("text-davinci-003");
    });

    // NOTE: Temperature Control
    const temperatureDiv = contentEl.createDiv()
    temperatureDiv.createEl("p", { text: "Temperature" });

    const currTemperatureComponent = new TextComponent(temperatureDiv);
    currTemperatureComponent.setValue(this.temperature.toString());
    currTemperatureComponent.then((cb) => {
      cb.inputEl.style.width = "50px";
    });
    currTemperatureComponent.onChange((value) => {
      const val = Number(value);
      if(val <= 1.0 && val >= 0.0) {
        this.temperature = val;
      } else {
        currTemperatureComponent.setValue(this.temperature.toString());
      }
    })

    const temperatureSliderDiv = temperatureDiv.createDiv();
    const temperatureSlider = new SliderComponent(temperatureSliderDiv);
    temperatureSlider.setLimits(0.0, 1.0, 0.1);
    temperatureSlider.setValue(this.temperature);
    temperatureSlider.then((cb) => {
      cb.sliderEl.setAttribute("style", "width: 50%;");
    });

    temperatureSlider.onChange((value) => {
      this.temperature = value;
      currTemperatureComponent.setValue(this.temperature.toString());
    });

    // NOTE: Max Token Control
    const maxTokensTextComponentDiv = contentEl.createDiv();
    maxTokensTextComponentDiv.createEl("p", { text: "Max Tokens" });
    const maxTokensTextComponent = new TextComponent(maxTokensTextComponentDiv)
    maxTokensTextComponent.setValue(this.maxTokens.toString());
    maxTokensTextComponent.then((cb) => {
      cb.inputEl.style.width = "50px";
    })
    maxTokensTextComponent.onChange((value) => {
      this.maxTokens = Number(value);
    })

    // NOTE: frequencyPenalty
    const frequencyPenaltyDiv = contentEl.createDiv()
    frequencyPenaltyDiv.createEl("p", { text: "Frequency Penality" });

    const currFrequencyPenaltyComponent = new TextComponent(frequencyPenaltyDiv);
    currFrequencyPenaltyComponent.setValue(this.frequencyPenalty.toString());
    currFrequencyPenaltyComponent.then((cb) => {
      cb.inputEl.style.width = "50px";
    });
    currFrequencyPenaltyComponent.onChange((value) => {
      const val = Number(value);
      if(val <= 2.0 && val >= 0.0 ) {
        this.frequencyPenalty = val;
      } else {
        currFrequencyPenaltyComponent.setValue(this.frequencyPenalty.toString());
      }
    });

    const frequencyPenaltySliderDiv = frequencyPenaltyDiv.createDiv();
    const frequencyPenaltySlider = new SliderComponent(frequencyPenaltySliderDiv);
    frequencyPenaltySlider.setLimits(0.0, 2.0, 0.1);
    frequencyPenaltySlider.setValue(this.frequencyPenalty);
    frequencyPenaltySlider.then((cb) => {
      cb.sliderEl.setAttribute("style", "width: 50%;");
    });

    frequencyPenaltySlider.onChange((value) => {
      this.frequencyPenalty = value;
      currFrequencyPenaltyComponent.setValue(this.frequencyPenalty.toString());
    });

    // NOTE: presencePenalty
    const presencePenaltyDiv = contentEl.createDiv()
    presencePenaltyDiv.createEl("p", { text: "Presence Penality" });

    const currpresencePenaltyComponent = new TextComponent(presencePenaltyDiv);
    currpresencePenaltyComponent.setValue(this.presencePenalty.toString());
    currpresencePenaltyComponent.then((cb) => {
      cb.inputEl.style.width = "50px";
    });
    currpresencePenaltyComponent.onChange((value) => {
      const val = Number(value);
      if(val <= 2.0 && val >= 0.0 ) {
        this.presencePenalty = val;
      } else {
        currpresencePenaltyComponent.setValue(this.presencePenalty.toString());
      }
    });

    const presencePenaltySliderDiv = presencePenaltyDiv.createDiv();
    const presencePenaltySlider = new SliderComponent(presencePenaltySliderDiv);
    presencePenaltySlider.setLimits(0.0, 2.0, 0.1);
    presencePenaltySlider.setValue(this.presencePenalty);
    presencePenaltySlider.then((cb) => {
      cb.sliderEl.setAttribute("style", "width: 50%;");
    });

    presencePenaltySlider.onChange((value) => {
      this.presencePenalty = value;
      currpresencePenaltyComponent.setValue(this.presencePenalty.toString());
    });

    // NOTE: number of completions control
    const nTextComponentDiv = contentEl.createDiv();
    nTextComponentDiv.createEl("p", { text: "Number of Completions" });
    const nTextComponent = new TextComponent(nTextComponentDiv)
    nTextComponent.setValue(this.numberOfCompletions.toString());
    nTextComponent.then((cb) => {
      cb.inputEl.style.width = "50px";
    })
    nTextComponent.onChange((value) => {
      this.numberOfCompletions = Number(value);
    })

    contentEl.createEl("hr");

    const submitButtonDiv = contentEl.createDiv()
    submitButtonDiv.setAttribute("style", "margin-top: 10px;");
    const submitButton = new ButtonComponent(submitButtonDiv);
    submitButton.setButtonText("Submit");
    submitButton.onClick(() => {
      this.close();
      new ExecutingGPTPromptModal(
        this.app, this.editor,
        this.prompt,
        this.selectedModel,
        this.temperature,
        this.maxTokens,
        this.frequencyPenalty,
        this.presencePenalty,
        this.numberOfCompletions,
        this.textCompletion
      ).open()
    });
  }

  onClose(): void {
    const {contentEl} = this;
    contentEl.empty()

  }
}