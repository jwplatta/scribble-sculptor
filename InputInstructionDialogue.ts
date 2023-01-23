import { App, Modal, Editor, TextAreaComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

export class InputInstructionDialogue extends Modal {
  sourceText: string;
  originalSourceText: string;
  transformedText: string;
  instructionText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, textCompletion: OpenAITextCompletion) {
		super(app);
    this.app = app;
    this.editor = editor;
    this.sourceText = sourceText.trim();
    this.originalSourceText = sourceText.trim();
    this.textCompletion = textCompletion;
	}

  async applyInstruction(text: string, instruction: string) {
    const prompt = `Apply the instruction to the text.\n"""instruction: ${instruction.trim()}\n"""\ntext:${text.trim()}"""`
    const result = await this.textCompletion.post(prompt);
    return result;
  }

	onOpen() {
		const {contentEl} = this;

    const mainDiv = contentEl.createDiv();
    mainDiv.createEl("h2", { text: "Selected Text" });

    const selectedTextInput = new TextAreaComponent(mainDiv);
    selectedTextInput.setValue(this.sourceText);
    selectedTextInput.inputEl.style.width = "100%";
    selectedTextInput.inputEl.style.height = "10rem";
    selectedTextInput.onChange((value) => {
      this.sourceText = value;
    });

    mainDiv.createEl("hr");
    mainDiv.createEl("p", { text: "What do you want to do with the selected text?"})

    const instructionTextArea = new TextAreaComponent(mainDiv);
    instructionTextArea.inputEl.style.width = "100%";
    instructionTextArea.inputEl.style.height = "10rem";

    instructionTextArea.onChange((value) => {
      this.instructionText = value;
    })

    const applyButtonDiv = mainDiv.createDiv();
    applyButtonDiv.setAttr("style", "margin-top: 5px;");

    const applyButton = new ButtonComponent(applyButtonDiv);
    applyButton.setButtonText("Apply");
    applyButton.onClick(() => {
      transformedTextInput.setDisabled(true);
      useButton.setDisabled(true);
      instructionTextArea.setDisabled(true);
      applyButton.setDisabled(true);

      if(this.instructionText) {
        this.applyInstruction(this.sourceText, this.instructionText).then((result) =>{
          this.transformedText = result.trim();
          transformedTextInput.setValue(this.transformedText)
        });

        transformedTextInput.setDisabled(false);
        useButton.setDisabled(false);
        instructionTextArea.setDisabled(false);
        applyButton.setDisabled(false);
      }
    });

    mainDiv.createEl("hr");
    mainDiv.createEl("h2", { text: "Result" });

    const transformedTextInput = new TextAreaComponent(mainDiv);
    transformedTextInput.setDisabled(true);
    transformedTextInput.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%; height: 10rem;");
    });
    transformedTextInput.onChange((value) => {
      this.transformedText = value;
    });

    const useButtonDiv = mainDiv.createDiv();
    useButtonDiv.setAttr("style", "padding-top: 5px;");

    const useButton = new ButtonComponent(useButtonDiv);
    useButton.setDisabled(true);
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close();
      const selectionWithText = this.originalSourceText + "\n\n" + this.transformedText.trim() + "\n";
      this.editor.replaceSelection(selectionWithText);
    });
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
