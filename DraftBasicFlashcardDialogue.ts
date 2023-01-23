import { App, Modal, Editor, TextComponent, ButtonComponent, TextAreaComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

export class DraftBasicFlashcardDialogue extends Modal {
  sourceText: string;
  originalSourceText: string;
  questionText: string;
  answerText: string;
  flashcard: string;
  keywords: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion

  constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.sourceText = sourceText;
    this.originalSourceText = originalSourceText;
    this.editor = editor;
    this.textCompletion = textCompletion;
  }

  flashcardTemplate(question: string, answer: string): string {
    const flashcard = `START\nBasic\n${question.trim()}\nBack:\n${answer.trim()}\nTags:\nEND`
    return flashcard
  }

  async draftQuestion(): Promise<string> {
    let prompt;

    if(this.keywords !== "") {
      prompt = `Write a question about the text focusing on the keywords.\n"""\ntext: ${this.sourceText}\n"""\nkeywords: ${this.keywords}\n"""\n`;
    } else {
      prompt = `Write a question about the main idea of the text.\n"""\ntext: ${this.sourceText}\n"""\n`;
    }

    const draft = await this.textCompletion.post(prompt);

    return draft;
  }

  async draftAnswer(): Promise<string> {
    const prompt = `Write an answer to the question using the text.\n"""\nquestion: ${this.questionText}\n"""\ntext: ${this.sourceText}\n"""\nanswer:`;

    const draft = await this.textCompletion.post(prompt);

    return draft;
  }

  onOpen(): void {
    const { contentEl } = this;

    const mainDiv = contentEl.createDiv();
    mainDiv.createEl("h2", { text: "Selected Text" });

    const selectedTextInput = new TextAreaComponent(mainDiv);
    selectedTextInput.setValue(this.sourceText);
    selectedTextInput.inputEl.style.width = "100%";
    selectedTextInput.inputEl.style.height = "10rem";
    selectedTextInput.onChange((value) => {
      this.sourceText = value;
    });

    const keywordsTextInput = new TextComponent(mainDiv)
    keywordsTextInput.setPlaceholder("Enter focus keywords...")
    keywordsTextInput.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%;");
    })
    keywordsTextInput.onChange((value) => {
      this.keywords = value;
    });

    const draftQuestionButtonDiv = mainDiv.createDiv();
		draftQuestionButtonDiv.setAttr("style", "margin-top: 5px;")

    const draftQuestionButton = new ButtonComponent(draftQuestionButtonDiv);
    draftQuestionButton.setButtonText("Draft question");
    draftQuestionButton.onClick(() => {
			draftQuestionButton.setDisabled(true);
      draftFlashcardButton.setDisabled(true);
      useButton.setDisabled(true);
			selectedTextInput.setDisabled(true);
			keywordsTextInput.setDisabled(true);
			draftedQuestionText.setDisabled(true);
      draftedFlashcardText.setDisabled(true);

			this.draftQuestion().then((questionText) => {
				this.questionText = questionText;
				draftedQuestionText.setValue(this.questionText);

				draftQuestionButton.setDisabled(false);
        draftFlashcardButton.setDisabled(false);
				selectedTextInput.setDisabled(false);
				draftedQuestionText.setDisabled(false);
				keywordsTextInput.setDisabled(false);

        if(this.flashcard) {
          draftedFlashcardText.setDisabled(false);
          useButton.setDisabled(false);
        }
			});
    });

		mainDiv.createEl("hr");
    mainDiv.createEl("h2", { text: "Question" });
    const draftedQuestionText = new TextAreaComponent(mainDiv);
    draftedQuestionText.setDisabled(true);
    draftedQuestionText.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%; height: 10rem;");
    });
		draftedQuestionText.onChange((value) => {
			this.questionText = value;
		});

    const draftFlashcardButtonDiv = mainDiv.createDiv();
		draftFlashcardButtonDiv.setAttr("style", "margin-top: 5px;")

    const draftFlashcardButton = new ButtonComponent(draftFlashcardButtonDiv);
    draftFlashcardButton.setDisabled(true);
    draftFlashcardButton.setButtonText("Draft flashcard");
    draftFlashcardButton.onClick(() => {

      if(this.questionText) {
        draftQuestionButton.setDisabled(true);
        draftFlashcardButton.setDisabled(true);
        useButton.setDisabled(true);
        selectedTextInput.setDisabled(true);
        keywordsTextInput.setDisabled(true);
        draftedQuestionText.setDisabled(true);
        draftedFlashcardText.setDisabled(true);

        this.draftAnswer().then((answerText) => {
          this.answerText = answerText;
          this.flashcard = this.flashcardTemplate(this.questionText, this.answerText);
          draftedFlashcardText.setValue(this.flashcard);

          draftQuestionButton.setDisabled(false);
          draftFlashcardButton.setDisabled(false);
          selectedTextInput.setDisabled(false);
          keywordsTextInput.setDisabled(false);
          draftedQuestionText.setDisabled(false);
          draftedFlashcardText.setDisabled(false);
          useButton.setDisabled(false);
        });
      }
    });

    mainDiv.createEl("hr");
    mainDiv.createEl("h2", { text: "Basic Flashcard" });
    const draftedFlashcardText = new TextAreaComponent(mainDiv);
    draftedFlashcardText.setDisabled(true);
    draftedFlashcardText.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%; height: 20rem;");
    });
		draftedFlashcardText.onChange((value) => {
			this.questionText = value;
		});

    // END

    const useButtonDiv = contentEl.createDiv();
    useButtonDiv.setAttr("style", "padding-top: 5px;");

    const useButton = new ButtonComponent(useButtonDiv);
    useButton.setDisabled(true);
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close()
      if(this.flashcard) {
        const selectionWithFlashcard = this.originalSourceText + "\n\n" + this.flashcard.trim() + "\n";
				this.editor.replaceSelection(selectionWithFlashcard);
      }
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}