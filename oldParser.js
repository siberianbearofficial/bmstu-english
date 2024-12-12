class OldParser {
    constructor(document) {
        this.document = document;
    }

    page1() {
        function extractQuestions(elements) {
            const questions = [];
            for (let element of elements) {
                const text = element.textContent.trim();
                if (text)
                    questions.push(text);
            }
            return questions;
        }

        function extractAnswers(elements) {
            const answers = [];
            for (let element of elements) {
                const text = element.textContent.trim();
                if (text)
                    for (let a of text.split('\n'))
                        answers.push(a.trim());
            }
            return answers.join('; ');
        }

        function extractQuestionsAndAnswers(content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const soup = doc.getElementById('page-content').getElementsByClassName('content');

            const questions = [];
            const answers = [];

            for (let element of soup) {
                const questionElements = element.getElementsByClassName('qtext');
                const answerElements = element.getElementsByClassName('answer');

                questions.push(...extractQuestions(questionElements));
                answers.push(extractAnswers(answerElements));
            }

            return {questions, answers};
        }

        function needSplitQuestionAndUnderlinings(w) {
            for (let c of w)
                if (c !== '_')
                    return false;
            return true;
        }

        function multiplyString(s, n) {
            const ready = [];
            for (let i = 0; i < n; i++)
                ready.push(s);
            return ready.join('');
        }

        function splitQuestionAndUnderlinings(w) {
            w = w.trim();
            let underlinings = true;
            let start_underlinings = true;
            let start_count = 0;
            let end_count = 0;

            for (let el of w) {
                if (el === '_' && underlinings && start_underlinings)
                    start_count++;
                else if (el === '_' && underlinings && !start_underlinings)
                    end_count++;
                else if (el !== '_')
                    start_underlinings = false;
            }

            const new_q = [];
            if (start_count)
                new_q.push(multiplyString('_', start_count));
            new_q.push(strip(w, '_'));
            if (end_count)
                new_q.append(multiplyString('_', end_count));
            return new_q
        }

        function packQuestionsWithAnswers(questions, answers) {
            const lines = [];
            for (let i = 0; i < questions.length; i++) {
                const new_question = [];
                for (let w of questions[i].trim().split(/\s+/)) {
                    if (questions[i].includes('_') && needSplitQuestionAndUnderlinings(w))
                        new_question.push(...splitQuestionAndUnderlinings(w));
                    else
                        new_question.push(w.trim());
                }
                lines.push(`${i + 1}. ${new_question.join(" ")}`);
                lines.push(answers[i]);
            }
            return lines;
        }

        function parse() {
            if (contentElement.value) {
                const questionsAndAnswers = extractQuestionsAndAnswers(contentElement.value);
                const lines = packQuestionsWithAnswers(questionsAndAnswers.questions, questionsAndAnswers.answers);
                const gptPrompt = 'Choose a, b or c to fill the gaps. Write the answers each on new line in the format: ' +
                    'n) letter. answer, where n is the question number, letter is a, b or c and answer is the associated ' +
                    'with the letter answer that fits the gap best. NOTHING ELSE should be in the answer!';
                readyElement.value = [gptPrompt, ...lines].join('\n');
            } else
                readyElement.value = 'Вы точно не забыли вставить HTML слева?';
        }

        parse();
    }

    page2() {
        function extractTaskText(elements) {
            const taskText = [];
            for (let element of elements) {
                const text = element.textContent.trim();
                if (text)
                    taskText.push(text);
            }
            return taskText;
        }

        function extractBlankOptions(elements) {
            const blankOptions = [];
            for (let element of elements) {
                const text = element.textContent.trim();
                if (text)
                    blankOptions.push(text);
            }
            return blankOptions;
        }

        function onlyUnderlinings(w) {
            for (let c of w)
                if (c !== '_')
                    return false;
            return true;
        }

        function isDigit(str) {
            return /^\d+$/.test(str);
        }

        function formatBlank(words, ind, blankOptions) {
            const blank = blankOptions[ind];
            return onlyUnderlinings(words[words.length - 1]) ? blank : `${blank} ${strip(words[words.length - 1], '_')}`;
        }

        function packTaskTextWithOptions(taskText, blanksOptions) {
            let blankIndex = 0;
            const newTaskText = [];
            for (let par of taskText) {
                const words = par.trim().split(/\s+/);
                const newWords = [];

                let inBlank = [];
                let blankStarted = false;
                for (let word of words) {
                    if (word && isDigit(word[0]) && word.includes('Blank'))
                        blankStarted = true;
                    else if (blankStarted && !word.includes('__'))
                        inBlank.push(word);
                    else if (blankStarted && word.includes('__')) {
                        inBlank.push(word);
                        blankStarted = false;
                        newWords.push(formatBlank(inBlank, blankIndex, blanksOptions));
                        blankIndex++;
                        inBlank = [];
                    } else
                        newWords.push(word);
                }
                newTaskText.push(newWords.join(' '));
            }
            return newTaskText;
        }

        function extractTaskTextAndOptions(content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const soup = doc.getElementById('page-content').getElementsByClassName('content');

            const taskText = [];
            const blanksOptions = [];
            let ind = 0;
            for (let element of soup) {
                console.log(element, element.querySelectorAll('select').length);
                taskText.push(...extractTaskText(element.querySelectorAll('p')));

                for (let selectElement of element.querySelectorAll('select')) {
                    const blankOptions = extractBlankOptions(selectElement.querySelectorAll('option'));
                    blanksOptions.push(`[${ind + 1}: ${blankOptions.join(', ')}]`);
                    ind++;
                }
            }

            return {taskText, blanksOptions};
        }

        function parse() {
            if (contentElement.value) {
                const taskTextAndOptions = extractTaskTextAndOptions(contentElement.value);
                const lines = packTaskTextWithOptions(taskTextAndOptions.taskText, taskTextAndOptions.blanksOptions);
                const gptPrompt = 'Choose the best word to fill the gap. Write the answers each on new line in the ' +
                    'format: n. chosen_word, where n is the number of the blank and chosen_word is your choice. ' +
                    'NOTHING ELSE should be in the answer!';
                readyElement.value = [gptPrompt, ...lines].join('\n');
            } else
                readyElement.value = 'Вы точно не забыли вставить HTML слева?';
        }

        parse();
    }
}