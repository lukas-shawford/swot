var util = require('util');
var Q = require('q');
var ptorExtensions = require('../ptorExtensions');

// Page Object for the quiz editor page
var QuizEditorPage = function () {
    var ptor = protractor.getInstance();
    var page = this;

    this.quizNameField = element(by.model('quiz.name'));
    this.saveButton = element(by.id('save'));
    this.loadMessage = element(by.id('load-message'));
    this.saveStatus = element(by.id('save-message'));
    this.saveError = element(by.binding('{{saveError}}'));
    this.addQuestionButton = element(by.id('add-question'));
    this.quizSettingsButton = element(by.id('quiz-settings-button'));

    /**
     * Loads the quiz editor for a new quiz.
     */
    this.create = function () {
        return browser.get(ptor.baseUrl + 'create').then(function () {
            ptor.waitForAngular();
            // An extra 250ms delay to reduce occasional flakiness
            ptor.sleep(250);
        });
    };

    /**
     * Loads an existing quiz for editing, waiting until it has finished loading.
     */
    this.edit = function (id) {
        var self = this;
        return browser.get(ptor.baseUrl + 'edit/' + id).then(function () {
            ptor.waitForAngular();
            // Wait for the quiz to finish loading (as indicated by the "Loading..." message being
            // hidden).
            ptor.wait(function () {
                return self.loadMessage.isDisplayed().then(function (v) {
                    return v === false;
                });
            })
            .then(function () {
                // An extra 250ms delay to reduce occasional flakiness
                ptor.sleep(250);
            });
        });
    };

    /**
     * Clicks the save button and waits for either a save confirmation message (saveStatus), or an
     * error (saveError).
     */
    this.save = function () {
        var saveStatus = this.saveStatus;
        var saveError = this.saveError;
        return ptor.executeScript('window.scrollTo(0,0);').then(function () {
            return page.saveButton.click();
        }).then(function () {
            return page.waitForSaveConfirmation();
        });
    };

    /**
     * Gets the question type for the given question number (starting at one). Returns a promise that
     * resolves to one of the following:
     * [ "fill-in", "multiple-choice" ]
     * Returns null if question type cannot be determined.
     */
    this.getQuestionType = function (number) {
        return page.getQuestionRow(number).findElement(by.css('.edit-question'))
        .then(function (questionContainer) {
            return questionContainer.getAttribute('class');
        })
        .then(function (cls) {
            if (/fill-in/.test(cls)) {
                return 'fill-in';
            } else if (/multiple-choice/.test(cls)) {
                return 'multiple-choice';
            }

            return null;
        });
    };

    /**
     * Sets the given question number (starting at one) to be the given type, where type should be
     * one of the following:
     * [ "fill-in", "multiple-choice" ]
     */
    this.setQuestionType = function (number, type) {
        var row = page.getQuestionRow(number);

        return page.hideQuestionToolbar(number)     // HACK ALERT
        .then(function () {
            // Give the ckeditor toolbar some time to go away
            ptor.sleep(250);

            // Ok, now that the ckeditor toolbar is gone and the question type menu is visible, we
            // can select the new question type that we want.
            switch (type) {
                case 'fill-in':
                    return row.findElement(by.css('.question-type-menu button.fill-in')).click();
                case 'multiple-choice':
                    return row.findElement(by.css('.question-type-menu button.multiple-choice')).click();
            }

            throw 'Invalid question type: "' + question.type + '".';
        });
    };

    /**
     * Returns both the question and the answer for the given question number (questions start at
     * number one, not zero). The 'type' property will be set to one of:
     * [ 'fill-in', 'multiple-choice']
     * The other properties depend on the question type. Returns a promise.
     */
    this.getQuestion = function (number) {
        var question;
        return page.getQuestionType(number)
            .then(function (questionType) {
                switch (questionType) {
                    case 'fill-in':
                        return page.getFillIn(number);
                    case 'multiple-choice':
                        return page.getMultipleChoice(number);
                    default:
                        throw 'Invalid question type: "' + questionType + '".';
                }
            })
            .then(function (q) {
                question = q;
                return page.getSupplementalInfo(number);
            })
            .then(function (info) {
                question.supplementalInfoHtml = info;
                return question;
            });
    };

    /**
     * Sets the contents of the given question number to the given question. The question parameter
     * should be an object with the 'type' property set to the question type (one of ["fill-in",
     * "multiple-choice"]), and the rest of the properties should be properly filled out for the
     * given question type. If the 'erase' parameter is true, will erase whatever is present by
     * hitting CTRL+A then BACKSPACE in each field before entering the contents.
     */
    this.setQuestion = function (number, question, erase) {
        var promise;
        switch (question.type) {
            case 'fill-in':
                promise = page.enterFillIn(number, question, erase);
                break;
            case 'multiple-choice':
                promise = page.enterMultipleChoice(number, question, erase);
                break;
            default:
                throw 'Invalid question type: "' + question.type + '".';
        }

        return promise.then(function () {
            if (question.supplementalInfoHtml) {
                return page.enterSupplementalInfo(number, question.supplementalInfoHtml, erase);
            }
        });
    };

    /**
     * Adds a new question by clicking the Add Question button. The question parameter should be an
     * object with the 'type' property set to the question type (one of ["fill-in", "multiple-choice"]),
     * and the rest of the properties should be properly filled out for the given question type.
     */
    this.addQuestion = function (question) {
        return page.clickAddQuestion().then(function () {
            return page.getNumQuestions();
        }).then(function (last) {
            return page.setQuestion(last, question, false);
        });
    };

    /**
     * Gets the number of questions currently in the quiz (returns a promise)
     */
    this.getNumQuestions = function () {
        //return element(by.repeater('question in quiz.questions')).count();
        return ptor.findElements(by.repeater('question in quiz.questions')).then(function (arr) {
            return arr.length;
        });
    };

    /**
     * Returns an object representing the fill-in question (including the answer, and all associated
     * settings). Assumes that the given question number (starting at one) is a fill-in question.
     */
    this.getFillIn = function (number) {
        var question = {
            type: 'fill-in'
        };

        return page.getQuestionField(number)
            .then(function (questionField) {
                return questionField.getText();
            })
            .then(function (text) {
                question.question = text;
                return page.getFillInAnswer(number);
            })
            .then(function (answer) {
                question.answer = answer;
                return page.getFillInAltsAsText(number);
            })
            .then(function (alts) {
                question.alternativeAnswers = alts;
                return page.getFillInIgnoreCase(number);
            })
            .then(function (ignoreCase) {
                question.ignoreCase = ignoreCase;
                return question;
            });
    };

    /**
     * Sets the given question number (starting at one) to be a fill-in question, and sets the contents
     * to the given question and answer. If the 'erase' parameter is true, will erase whatever is
     * present by hitting CTRL+A then BACKSPACE in each field before entering the contents.
     */
    this.enterFillIn = function (number, question, erase) {
        return page.setQuestionType(number, 'fill-in')
        .then(function () {
            return page.getQuestionField(number);
        })
        .then(function (questionField) {
            if (erase) {
                questionField.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                questionField.sendKeys(protractor.Key.BACK_SPACE);
            }
            questionField.sendKeys(question.question);
            return page.getFillInAnswerField(number);
        })
        .then(function (answerField) {
            if (erase) {
                answerField.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                answerField.sendKeys(protractor.Key.BACK_SPACE);
            }
            return answerField.sendKeys(question.answer);
        })
        .then(function () {
            var alts = question.alternativeAnswers.slice(0);
            return page.enterRemainingAltAns(number, alts, 0, erase);
        })
        .then(function () {
            return page.setFillInIgnoreCase(number, question.ignoreCase);
        });
    };

    /**
     * Returns an object representing the multiple-choice question (including the choices, the correct
     * answer, and all associated settings). Assumes that the given question number (starting at one)
     * is a multiple choice question.
     */
    this.getMultipleChoice = function (number) {
        var question = {
            type: 'multiple-choice'
        };

        return page.getQuestionField(number)
            .then(function (questionField) {
                return questionField.getText();
            })
            .then(function (text) {
                question.question = text;
                return page.getChoicesAsText(number);
            })
            .then(function (choices) {
                question.choices = choices;
                return page.getCorrectChoiceIndex(number);
            })
            .then(function (correctAnswerIndex) {
                question.correctAnswerIndex = correctAnswerIndex;
                return question;
            });
    };

    /**
     * Sets the given question number (starting at one) to be a multiple-choice question, and sets
     * the contents to the given question. If the 'erase' parameter is true, will erase whatever is
     * present by hitting CTRL+A then BACKSPACE in each field before entering the contents.
     */
    this.enterMultipleChoice = function (number, question, erase) {
        return page.setQuestionType(number, 'multiple-choice')
        .then(function () {
            return page.getQuestionField(number);
        })
        .then(function (questionField) {
            if (erase) {
                questionField.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                questionField.sendKeys(protractor.Key.BACK_SPACE);
            }
            questionField.sendKeys(question.question);
            var choices = question.choices.slice(0);
            return page.enterRemainingChoices(number, choices, 0, erase);
        })
        .then(function () {
            return page.markChoiceAsCorrect(number, question.correctAnswerIndex);
        });
    };

    /**
     * Clicks the "Add Question" button and waits for the animation to finish playing. Moves the mouse
     * away from the button so the tooltip disappears.
     */
    this.clickAddQuestion = function () {
        return this.addQuestionButton.click().then(function () {
            return page.getNumQuestions();
        }).then(function (last) {
            browser.actions().mouseMove(page.getQuestionField(last)).perform();
            ptor.sleep(800);        // wait for animation
        });
    };

    /**
     * Duplicates a question
     */
    this.copyQuestion = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
            .findElement(by.css('.copy-question'))
            .click()
            .then(function () {
                ptor.sleep(800);    // Allow some time for the animation to finish playing
            });
    };

    /**
     * Deletes a question
     */
    this.deleteQuestion = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
            .findElement(by.css('.delete-question'))
            .then(function (deleteButton) {
                return deleteButton.click();
            }).then(function () {
                ptor.sleep(800);
                element(by.css('.confirm-popover .confirmbutton-yes')).click();
                ptor.sleep(800);
            });
    };

    /**
     * Deletes the whole quiz
     */
    this.deleteQuiz = function () {
        return page.quizSettingsButton.click().then(function () {
            return element(by.id('delete-quiz')).click();
        }).then(function () {
            ptor.sleep(800);     // wait for animation
            return element(by.id('confirm-delete-quiz')).click();
        });
    };

    /**
     * Gets the drag handle for a question (which allows reordering questions using drag and drop).
     */
    this.getDragHandle = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
                .findElement(by.css('.drag-handle'));
    };

    /**
     * Reorders questions by dragging and dropping.
     */
    this.moveQuestion = function (questionToMove, positionToMoveTo) {
        return page.getQuestionField(positionToMoveTo).then(function (dest) {
            page.getDragHandle(questionToMove).then(function (dragHandle) {
                ptor.actions().dragAndDrop(dragHandle, dest).perform();
                ptor.sleep(800);    // wait for animation
            });
        });
    };

    /**
     * Waits for the "Saved" message to become visible.
     */
    this.waitForSaveConfirmation = function () {
        var saveStatus = this.saveStatus;
        var saveError = this.saveError;

        var timeoutId = setTimeout(function () {
            throw new Error('Timed out while waiting for autosave.');
        }, 3000);

        ptor.wait(function () {
            return page.saveStatus.isDisplayed().then(function (v) {
                if (v) {
                    clearTimeout(timeoutId);
                    return true;
                }
                return false;
            });
        });
    };

    /**
     * HACK ALERT:
     * If the question field has focus, the CKEditor toolbar may obscure elements in the header.
     * This is actually a usability issue with the site that should really be addressed.
     * The ckeditor toolbar should either be reduced to just the bare essentials so that it's
     * a single row, or more spacing needs to be added between the question header and the
     * question field, or both - this will be addressed when I give the site a facelift.
     * Once that's done, this can go away.
     *
     * For now, to prevent certain tests from failing, we make the toolbar go away by clicking into
     * either the answer field (if it's a fill-in question), or one of the choices (if it's a
     * multiple choice question). Kind of lame... and that's roughly what the user would have to
     * do as well if they wanted to switch the question type or show the settings.
     */
    this.hideQuestionToolbar = function (number) {
        // Get the current question type (the type we're switching *away* from), pretty much just
        // so that we can find another appropriate element nearby that we can click on without
        // having to scroll so that the question field loses focus, and the ckeditor toolbar
        // goes away and reveals the question type menu.
        return page.getQuestionType(number).then(function (currentType) {
            switch(currentType) {
                case 'fill-in':
                    return page.getFillInAnswerField(number).click();
                case 'multiple-choice':
                    return page.getChoiceField(number, 0).click();
            }
            throw 'Current question type is invalid: "' + currentType + '".';
        });
    };

    /**
     * Returns an Angular repeater row element for the given question number (starting at one).
     */
    this.getQuestionRow = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1));
    };

    /**
     * Retrieves the question editor field for the given question number (questions start at number
     * one, not zero). Note that this returns a promise object, not the field itself.
     */
    this.getQuestionField = function (number) {
        return page.getQuestionRow(number).findElement(by.css('.question-editor'));
    };

    /**
     * Opens up the settings for the question (if not already open).
     */
    this.showQuestionSettings = function (number) {
        var settingsToggle;

        return element(by.repeater('question in quiz.questions').row(number - 1)).findElement(by.css('.toggle-settings'))
            .then(function (elem) {
                settingsToggle = elem;
                return settingsToggle.getAttribute('class');
            })
            .then(function (cls) {
                if (/active/.test(cls)) {
                    // Settings already open - do nothing
                    return;
                }
                return page.hideQuestionToolbar(number)     // HACK ALERT
                    .then(function () {
                        return settingsToggle.click();
                    });
            });
    };

    /**
     * Retrieves the answer field for the given question number (starting at one). Assumes the current
     * question is a fill-in question.
     */
    this.getFillInAnswerField = function (number) {
        return page.getQuestionRow(number).findElement(by.css('.fill-in-answer'));
    };

    /**
     * Returns the fill-in answer as a string for the given question number (starting at one). Assumes
     * the current question is a fill-in question. Returns a promise.
     */
    this.getFillInAnswer = function (number) {
        return page.getFillInAnswerField(number).then(function (answerField) {
            return answerField.getAttribute('value');
        });
    };

    /**
     * Gets the checkbox field for the "Ignore capitalization" setting for the given question number
     * (starting at one). Assumes the question is a fill-in question.
     */
    this.getFillInIgnoreCaseField = function (number) {
        return page.showQuestionSettings(number)
            .then(function () {
                return element(by.repeater('question in quiz.questions').row(number - 1)).findElement(by.model('question.ignoreCase'));
            });
    };

    /**
     * Returns a promise that resolves to true if the "Ignore capitalization" setting is turned on
     * for the given question number (starting at one). Assumes the question is a fill-in question.
     */
    this.getFillInIgnoreCase = function (number) {
        return page.getFillInIgnoreCaseField(number)
            .then(function (checkbox) {
                return checkbox.getAttribute('checked');
            })
            .then(function (checked) {
                return checked === 'true';
            });
    };

    /**
     * Sets the the "Ignore capitalization" setting for the given question number (starting at one)
     * to the given value (true or false). Assumes the question is a fill-in question.
     */
    this.setFillInIgnoreCase = function (number, value) {
        value = !!value;    // Force boolean
        return page.getFillInIgnoreCase(number)
            .then(function (currentValue) {
                if (currentValue != value) {
                    return page.getFillInIgnoreCaseField(number)
                        .then(function (checkbox) {
                            return checkbox.click();
                        });
                }
            });
    };

    /**
     * For the given question number (starting at one), which is assumed to be a multiple choice
     * question, returns the text of the given choice index (starting at zero... sorry). Returns a
     * promise.
     */
    this.getChoice = function (questionNumber, choiceIndex) {
        return page.getChoiceField(questionNumber, choiceIndex).then(function (field) {
            return field.getAttribute('value');
        });
    };

    /**
     * For the given question number (starting at one), which is assumed to be a multiple choice
     * question, sets the text of the given choice index (starting at zero... sorry) to the given
     * value. Will automatically click on the Add button to add more choices if the choice index is
     * out of range. If the 'erase' parameter is true, then any existing contents for the given choice
     * will be erased by sending CTRL+A then BACKSPACE before entering the new value.
     */
    this.setChoice = function (questionNumber, choiceIndex, choiceText, erase) {
        return page.getNumChoices(questionNumber).then(function (numChoices) {
            if (choiceIndex >= numChoices) {
                return page.clickAddChoice(questionNumber).then(function () {
                    return page.setChoice(questionNumber, choiceIndex, choiceText, erase);
                });
            } else {
                return page.getChoiceField(questionNumber, choiceIndex).then(function (field) {
                    if (erase) {
                        field.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                        field.sendKeys(protractor.Key.BACK_SPACE);
                    }
                    return field.sendKeys(choiceText);
                });
            }
        });
    };

    /**
     * For the given question number (starting at one), and the given choice index (starting at
     * zero... sorry), mark the choice as being correct. The question is assumed to be a multiple
     * choice question.
     */
    this.markChoiceAsCorrect = function (questionNumber, choiceIndex) {
        return page.getQuestionRow(questionNumber)
            .findElement(by.css('.choices .choice:nth-of-type(' + (choiceIndex + 1) + ') .marker'))
            .click();
    };

    /**
     * For the given question number (starting at one), returns the number of choices currently
     * present. Assumes the given question number is a multiple choice question. Returns a promise.
     */
    this.getNumChoices = function (questionNumber) {
        return page.getQuestionRow(questionNumber)
            .findElements(by.css('.multiple-choice .choices .choice'))
            .then(function (elems) {
                return elems.length;
            });
    };

    /**
     * Returns the choices as an array of strings for the given question number (starting at one).
     * The question is assumed to be a multiple choice question. Returns a promise.
     */
    this.getChoicesAsText = function (questionNumber) {
        return page.getQuestionRow(questionNumber).findElements(by.css('.choices .choice .choice-editor'))
        .then(function (editorElems) {
            var promises = [];
            for (var i = 0; i < editorElems.length; i++) {
                promises.push(editorElems[i].getAttribute('value'));
            }
            return Q.all(promises);
        });
    };

    /**
     * Returns the correct choice index for the given question number (starting at one). The question
     * is assumed to be a multiple choice question.
     */
    this.getCorrectChoiceIndex = function (questionNumber) {
        // Find all the marker elements for each choice (the marker is the button that's used
        // to mark a particular choice is correct.)
        return page.getQuestionRow(questionNumber).findElements(by.css('.choices .choice .marker'))
        .then(function (markerElems) {
            // Test each marker element to see if it has the 'correct' class applied to it. This
            // requires resolving an array of promises, since hasClass returns a promise.
            var promises = [];
            for (var i = 0; i < markerElems.length; i++) {
                promises.push(ptorExtensions.hasClass(markerElems[i], 'correct'));
            }
            return Q.all(promises);
        })
        .then(function (results) {
            return results.indexOf(true);
        });
    };

    /**
     * Returns the input field for the given question number (starting at one) and the given choice
     * index (starting at zero... sorry). The question is assumed to be a multiple choice question.
     */
    this.getChoiceField = function (questionNumber, choiceIndex) {
        return page.getQuestionRow(questionNumber)
            .findElement(by.css('.choices .choice:nth-of-type(' + (choiceIndex + 1) + ') .choice-editor'));
    };

    /**
     * Clicks on the "Add" button to add a choice for the given question number (starting at one).
     * The question is assumed to be a multiple choice question.
     */
    this.clickAddChoice = function (questionNumber) {
        return page.getQuestionRow(questionNumber).findElement(by.css('.add-choice')).click();
    };

    /**
     * Recursively adds in the remaining choices for a multiple choice question.
     */
    this.enterRemainingChoices = function (questionNumber, remainingChoices, startIndex, erase) {
        if (remainingChoices.length === 0) {
            return;
        } else {
            var choice = remainingChoices.splice(0, 1);
            return page.setChoice(questionNumber, startIndex, choice, erase).then(function () {
                startIndex++;
                return page.enterRemainingChoices(questionNumber, remainingChoices, startIndex);
            });
        }
    };

    /**
     * For the given question number (starting at one), removes the given choice index (starting at
     * zero... sorry). Assumes that the question is a multiple choice question, and that the choice
     * index is valid.
     */
    this.removeChoice = function (questionNumber, choiceIndex) {
        return page
            .getQuestionRow(questionNumber)
            .findElement(by.css('.choices .choice:nth-of-type(' + (choiceIndex + 1) + ') .remove-choice'))
            .click();
    };

    /**
     * For the given question number (starting at one), which is assumed to be a fill-in question,
     * returns the text of the alternative answer at the given index (starting at zero).
     */
    this.getAltAns = function (questionNumber, index) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getAltAnsField(questionNumber, index).then(function (field) {
                    return field.getAttribute('value');
                });
            });
    };

    /**
     * For the given question number (starting at one), which is assumed to be a fill-in question,
     * sets the text of the alternative answer at the given index (starting at zero) to the given
     * value. Will automatically click on the Add button to add more alternative answers if the
     * index is out of range. If the 'erase' parameter is true, then any existing contents for the
     * given alternative answer will be erased by sending CTRL+A then BACKSPACE before entering the
     * new value.
     */
    this.setAltAns = function (questionNumber, index, text, erase) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getNumAltAnswers(questionNumber).then(function (numAltAns) {
                    if (index >= numAltAns) {
                        return page.clickAddAltAns(questionNumber).then(function () {
                            return page.setAltAns(questionNumber, index, text, erase);
                        });
                    } else {
                        return page.getAltAnsField(questionNumber, index).then(function (field) {
                            if (erase) {
                                field.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                                field.sendKeys(protractor.Key.BACK_SPACE);
                            }
                            return field.sendKeys(text);
                        });
                    }
                });
            });
    };

    /**
     * For the given question number (starting at one), returns the number of alternative answers
     * currently present. Assumes the given question number is a fill-in question. Returns a promise.
     */
    this.getNumAltAnswers = function (questionNumber) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getQuestionRow(questionNumber)
                    .findElements(by.css('.fill-in-alts-container .fill-in-alt'))
                    .then(function (elems) {
                        return elems.length;
                    });
            });
    };

    /**
     * Returns the alternative answers as an array of strings for the given question number (starting at one).
     * The question is assumed to be a fill-in question. Returns a promise.
     */
    this.getFillInAltsAsText = function (questionNumber) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getQuestionRow(questionNumber).findElements(by.css('.fill-in-alts-container .alt-answer-editor'))
                    .then(function (editorElems) {
                        var promises = [];
                        for (var i = 0; i < editorElems.length; i++) {
                            promises.push(editorElems[i].getAttribute('value'));
                        }
                        return Q.all(promises);
                    });
            });
    };

    /**
     * Returns the input field for the alternative answer textbox for the given question number
     * (starting at one) and the given alternative answer index (starting at zero). The question
     * is assumed to be a fill-in question.
     */
    this.getAltAnsField = function (questionNumber, index) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getQuestionRow(questionNumber)
                    .findElement(by.css('.fill-in-alts-container .fill-in-alt:nth-of-type(' + (index + 1) + ') .alt-answer-editor'));
            });
    };

    /**
     * Clicks on the "Add" button to add an alternative answer for a fill-in question.
     */
    this.clickAddAltAns = function (questionNumber) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page.getQuestionRow(questionNumber).findElement(by.css('.add-alt-ans')).click();
            });
    };

    /**
     * Recursively adds in the remaining alternative answers for a fill-in question.
     */
    this.enterRemainingAltAns = function (questionNumber, remaining, startIndex, erase) {
        if (remaining.length === 0) {
            return;
        } else {
            return page.showQuestionSettings(questionNumber)
                .then(function () {
                    var ans = remaining.splice(0, 1);
                    return page.setAltAns(questionNumber, startIndex, ans, erase).then(function () {
                        startIndex++;
                        return page.enterRemainingAltAns(questionNumber, remaining, startIndex);
                    });
                });
        }
    };

    /**
     * For the given question number (starting at one), removes the alternative answer with the
     * given index (starting at zero). Assumes that the question is a fill-in question, and that
     * the index is valid.
     */
    this.removeAltAns = function (questionNumber, index) {
        return page.showQuestionSettings(questionNumber)
            .then(function () {
                return page
                    .getQuestionRow(questionNumber)
                    .findElement(by.css('.fill-in-alts-container .fill-in-alt:nth-of-type(' + (index + 1) + ') .remove-alt-ans'))
                    .click();
            });
    };

    /**
     * Returns the Supplemental Information field for the given question number (starting at one).
     */
    this.getSupplementalInfoField = function (number) {
        return page.showQuestionSettings(number).then(function () {

            // Unfortunately, there is a fairly long delay before the Supplemental Information field
            // finishes initializing and becomes populated. Due to this ckeditor bug:
            //
            //     http://dev.ckeditor.com/ticket/11789
            //
            // We delay initializing ckeditor until the settings actually get shown (which is after
            // clicking the settings button). However, we add an additional 250ms delay before even
            // attempting to initialize ckeditor in order to make the toggle animation for showing/hiding
            // the settings play a bit more smoothly, and on top of that, ckeditor itself takes some time
            // to initialize.
            //
            // Once the ckeditor bug is fixed, and the app is updated so that these fields get loaded
            // when the page itself loads, this sleep call can be removed.
            ptor.sleep(400);

            return page.getQuestionRow(number).findElement(by.css('.supplemental-info-editor'));
        });
    };

    /**
     * Returns the contents of the Supplemental Information field for the given question number.
     */
    this.getSupplementalInfo = function (number) {
        return page.getSupplementalInfoField(number).then(function (field) {
            return field.getText();
        });
    };

    /**
     * Sets the Supplemental Information field for the given question number (starting at one)
     * to the given text. If the 'erase' parameter is true, will erase whatever is  present by
     * hitting CTRL+A then BACKSPACE before entering the new contents.
     */
    this.enterSupplementalInfo = function (number, info, erase) {
        return page.getSupplementalInfoField(number).then(function (field) {
                if (erase) {
                    field.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
                    field.sendKeys(protractor.Key.BACK_SPACE);
                }
                field.sendKeys(info);
            });
    };
};

module.exports = QuizEditorPage;
