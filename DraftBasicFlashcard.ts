import { App, Modal, Editor, TextComponent, ButtonComponent, TextAreaComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

class DraftFlashcard extends Modal {
  answerText: string;
  questionText: string;
  sourceText: string;
  originalSourceText: string;
  keywords: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;
  flashcard: string;

  constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, keywords: string, questionText: string, answerText:  string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.sourceText = sourceText;
    this.originalSourceText = originalSourceText;
    this.keywords = keywords
    this.questionText = questionText.trim();
    this.answerText = answerText.trim();
    this.editor = editor;
    this.textCompletion = textCompletion;
  }

  flashcardTemplate(question: string, answer: string): string {
    const flashcard = `START\nBasic\n${question}\nBack:\n${answer}\nTags:\nEND`
    return flashcard
  }

  onOpen(): void {
    this.flashcard = this.flashcardTemplate(this.questionText, this.answerText);

    const { contentEl } = this;

    const mainDiv = contentEl.createDiv();
    mainDiv.createEl("h2", { text: "Draft Flashcard"});
    mainDiv.createEl("h4", { text: "Source text:"});
    mainDiv.createEl("p", { text: this.sourceText });

    const flashcardTextArea = new TextAreaComponent(mainDiv);
    flashcardTextArea.setValue(this.flashcard);
    flashcardTextArea.inputEl.style.width = "100%";
    flashcardTextArea.inputEl.style.height = "20rem";
    flashcardTextArea.onChange((value) => {
      this.flashcard = value;
    });

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "margin-top: 5px;");

    const useButton = new ButtonComponent(footerDiv)
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close();
      const selectionWithDraft = this.originalSourceText + "\n\n" + this.flashcard.trim() + "\n";
      this.editor.replaceSelection(selectionWithDraft);
    })
    useButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;");
    })

    const restartButton = new ButtonComponent(footerDiv)
    restartButton.setButtonText("Restart");
    restartButton.onClick(() => {
      this.close();
      new DraftBasicFlashcardKeywordsModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.textCompletion).open();
    })
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class DraftingAnswerModal extends Modal {
  questionText: string;
  sourceText: string;
  originalSourceText: string;
  keywords: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, keywords: string, questionText: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.sourceText = sourceText;
    this.originalSourceText = originalSourceText;
    this.keywords = keywords
    this.questionText = questionText.trim();
    this.editor = editor;
    this.textCompletion = textCompletion;
  }

  async draftAnswer(): Promise<string> {
    const prompt = `Write an answer to the question using the text.\n"""\nquestion: ${this.questionText}\n"""\ntext: ${this.sourceText}\n"""\nanswer:`;

    const draft = await this.textCompletion.post(prompt);

    return draft;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: "Generating an answer..."});

    this.draftAnswer().then((answerText) => {
      this.close();
      new DraftFlashcard(this.app, this.editor, this.sourceText, this.originalSourceText, this.keywords, this.questionText, answerText, this.textCompletion).open();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();

  }
}


class DraftQuestionModal extends Modal {
  questionText: string;
  sourceText: string;
  originalSourceText: string;
  keywords: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, keywords: string, questionText: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.sourceText = sourceText;
    this.originalSourceText = originalSourceText;
    this.keywords = keywords
    this.questionText = questionText.trim();
    this.editor = editor;
    this.textCompletion = textCompletion;
  }

  onOpen(): void {
    const { contentEl } = this;

    const mainDiv = contentEl.createDiv();
    mainDiv.createEl("h2", { text: "Question Text:"});

    const questionTextArea = new TextAreaComponent(mainDiv);
    questionTextArea.setValue(this.questionText);
    questionTextArea.inputEl.style.width = "100%";
    questionTextArea.inputEl.style.height = "10rem";
    questionTextArea.onChange((value) => {
      this.sourceText = value;
    });

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "margin-top: 5px;")

    const useButton = new ButtonComponent(footerDiv)
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close();
      new DraftingAnswerModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.keywords, this.questionText, this.textCompletion).open()
    })
    useButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;");
    })

    const tryAgainButton = new ButtonComponent(footerDiv)
    tryAgainButton.setButtonText("Try again");
    tryAgainButton.onClick(() => {
      this.close();
      new DraftBasicFlashcardKeywordsModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.textCompletion).open();
    })
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class DraftingQuestionModal extends Modal {
  sourceText: string;
  originalSourceText: string;
  keywords: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, keywords: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
    this.sourceText = sourceText.trim();
    this.originalSourceText = originalSourceText;
    this.keywords = keywords
    this.editor = editor;
    this.textCompletion = textCompletion;
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

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: "Generating a question..."});

    this.draftQuestion().then((questionText) => {
      this.close();
      new DraftQuestionModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.keywords, questionText, this.textCompletion).open();
    })
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class DraftBasicFlashcardKeywordsModal extends Modal {
  sourceText: string;
  originalSourceText: string;
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

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Basic Flashcard" });

    const mainDiv = contentEl.createDiv();
    mainDiv.setAttr("style", "margin-top: 10px;")

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

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "padding-top: 5px;");

    const draftButton = new ButtonComponent(footerDiv);
    draftButton.setButtonText("Draft");
    draftButton.onClick(() => {
      this.close()
      new DraftingQuestionModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.keywords, this.textCompletion).open()
    })
    draftButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin-top: 5x;");
    })
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}