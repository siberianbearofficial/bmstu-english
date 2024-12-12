class AltParser {
    constructor(document) {
        if (!document) {
            throw TypeError('document arg should be of type Document');
        }

        this.document = document;
    }

    parseTasks1(taskElements) {
        const lines = [];
        for (let taskElement of taskElements) {
            lines.push(...this.parseSingleTask1(taskElement));
        }
        const gptPrompt = 'Choose a, b or c to fill the gaps. Write the answers each on new line in the format: ' +
            'n) letter. answer, where n is the question number, letter is a, b or c and answer is the associated ' +
            'with the letter answer that fits the gap best. NOTHING ELSE should be in the answer!';
        return [gptPrompt, ...lines, ''];
    }

    parseSingleTask1(taskElement) {
        const extracted = this.extractQuestionAndAnswers(taskElement);
        const number = this.extractNumber(taskElement);
        return [`Task ${number}.`, extracted.question, extracted.answers];
    }

    parseTasks2(taskElements) {
        const lines = [];
        const gptPrompt = 'Choose the best word to fill the gap. Write the answers each on new line in the ' +
            'format: n. chosen_word, where n is the number of the blank and chosen_word is your choice. ' +
            'NOTHING ELSE should be in the answer!';
        for (let taskElement of taskElements) {
            const number = this.extractNumber(taskElement);
            lines.push(gptPrompt, '', this.extractTextAndOptions(taskElement), '', '');
        }
        return [...lines, ''];
    }

    parseSingleTask2(taskElement) {
        const number = this.extractNumber(taskElement);
        return [`Task ${number}.`, this.extractTextAndOptions(taskElement)];
    }

    extractTextAndOptions(taskElement) {
        let text = '';
        let ind = 0;
        const selects = [];

        const taskContent = taskElement.getElementsByClassName('content');
        for (let element of taskContent) {
            for (let cringe of element.getElementsByClassName('accesshide')) {
                cringe.textContent = '';
            }
            for (let blank of element.getElementsByClassName('sr-only')) {
                blank.textContent = '';
            }
            for (let select of element.querySelectorAll('select')) {
                const blankOptions = []
                for (let option of select.querySelectorAll('option')) {
                    const optionText = option.textContent.trim();
                    if (optionText)
                        blankOptions.push(optionText);
                }
                selects.push(blankOptions)

                select.textContent = `[[BLANK-${ind}]]`;
                ind += 1;
            }
            text = element.textContent.trim();

            ind = 0;
            for (let select of selects) {
                text = text.replace(`[[BLANK-${ind}]]`, `[${ind + 1}: ${select.join(', ')}]`)
                ind += 1;
            }
        }
        return text;
    }

    extractQuestion(elements) {
        const questions = [];
        for (let element of elements) {
            const text = element.textContent.trim();
            if (text)
                questions.push(text);
        }
        let res = questions.join('');
        while (res.includes('  '))
            res = res.replace('  ', ' ');
        return res;
    }

    extractAnswers(elements) {
        const answers = [];
        for (let element of elements) {
            const text = element.textContent.trim();
            if (text)
                for (let a of text.split('\n')) {
                    a = a.trim();
                    if (a) {
                        const lastAnswer = answers[answers.length - 1];
                        if (lastAnswer && lastAnswer.length <= 2 && lastAnswer.endsWith('.')) {
                            answers[answers.length - 1] = lastAnswer + a;
                        } else
                            answers.push(a);
                    }
                }
        }
        return answers.join('; ');
    }

    extractQuestionAndAnswers(element) {
        const questionElements = element.getElementsByClassName('qtext');
        const answerElements = element.getElementsByClassName('answer');
        const numberElements = element.getElementsByClassName('qno');

        const question = this.extractQuestion(questionElements)
        const answers = this.extractAnswers(answerElements)
        const number = numberElements[0].innerText;

        return {question, answers, number};
    }

    extractNumber(element) {
        const numberElements = element.getElementsByClassName('qno');
        return numberElements[0].innerText;
    }

    extractTasks(doc) {
        const soup = doc.getElementById('page-content').getElementsByClassName('que');

        const tasks = [];
        let ind = 0;
        for (let element of soup) {
            if (element.getElementsByClassName('content')[0].querySelectorAll('select').length > 0) {
                tasks.push({type: 2, element});
            } else {
                tasks.push({type: 1, element})
            }
        }

        return tasks;
    }

    parseAll() {
        const tasks = this.extractTasks(this.document);
        const lines = []
        // if (tasks.tasks1.length) {
        //     lines.push(...parseTasks1(tasks.tasks1))
        // }
        // lines.push('', '')
        // if (tasks.tasks2.length) {
        //     lines.push(...parseTasks2(tasks.tasks2))
        // }

        for (let task of tasks) {
            if (task.type === 1) {
                console.log('task 1')
                lines.push(...this.parseSingleTask1(task.element), '');
            } else if (task.type === 2) {
                console.log('task 2')
                lines.push(...this.parseSingleTask2(task.element), '');
            }
        }

        return lines.join('\n');
    }
}
