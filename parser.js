function parseTasks1(taskElements) {
    const lines = [];
    for (let taskElement of taskElements) {
        const extracted = extractQuestionAndAnswers(taskElement);
        const number = extractNumber(taskElement);
        lines.push(`${number}. ${extracted.question}`, extracted.answers);
    }
    const gptPrompt = 'Choose a, b or c to fill the gaps. Write the answers each on new line in the format: ' +
        'n) letter. answer, where n is the question number, letter is a, b or c and answer is the associated ' +
        'with the letter answer that fits the gap best. NOTHING ELSE should be in the answer!';
    return [gptPrompt, ...lines];
}

function parseTasks2(taskElements) {
    const lines = [];
    const gptPrompt = 'Choose the best word to fill the gap. Write the answers each on new line in the ' +
                    'format: n. chosen_word, where n is the number of the blank and chosen_word is your choice. ' +
                    'NOTHING ELSE should be in the answer!';
    for (let taskElement of taskElements) {
        console.log('task2');
        const number = extractNumber(taskElement);
        lines.push(gptPrompt, '', extractTextAndOptions(taskElement), '', '');
    }
    return [...lines];
}

function extractTextAndOptions(taskElement) {
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

function extractQuestion(elements) {
    const questions = [];
    for (let element of elements) {
        const text = element.textContent.trim();
        if (text)
            questions.push(text);
    }
    return questions.join('');
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

function extractQuestionAndAnswers(element) {
    const questionElements = element.getElementsByClassName('qtext');
    const answerElements = element.getElementsByClassName('answer');
    const numberElements = element.getElementsByClassName('qno');

    const question = extractQuestion(questionElements)
    const answers = extractAnswers(answerElements)
    const number = numberElements[0].innerText;

    return {question, answers, number};
}

function extractNumber(element) {
    const numberElements = element.getElementsByClassName('qno');
    return numberElements[0].innerText;
}

function extractTasks(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const soup = doc.getElementById('page-content').getElementsByClassName('que');

    const tasks1 = [];
    const tasks2 = [];
    let ind = 0;
    for (let element of soup) {
        if (element.getElementsByClassName('content')[0].querySelectorAll('select').length > 0) {
            tasks2.push(element);
        } else {
            tasks1.push(element)
        }
    }

    return {tasks1, tasks2};
}

function parseAll(content) {
    const tasks = extractTasks(content);
    const lines = []
    if (tasks.tasks1.length) {
        lines.push(...parseTasks1(tasks.tasks1))
    }
    lines.push('', '')
    if (tasks.tasks2.length) {
        lines.push(...parseTasks2(tasks.tasks2))
    }

    return lines.join('\n');
}
