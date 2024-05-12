from bs4 import BeautifulSoup


def split_question_and_underlinings(w):
    w = w.strip()
    underlinings = True
    start_underlinings = True
    start_count = end_count = 0

    for el in w:
        if el == '_' and underlinings and start_underlinings:
            start_count += 1
        elif el == '_' and underlinings and not start_underlinings:
            end_count += 1
        elif el != '_':
            start_underlinings = False

    new_q = list()
    if start_count:
        new_q.append(start_count * '_')
    new_q.append(w.strip('_'))
    if end_count:
        new_q.append(end_count * '_')
    return new_q


def pack_questions_with_answers(questions, answers):
    lines = list()
    for i in range(len(questions)):
        new_question = list()
        for w in questions[i].strip().split():
            if '_' in questions[i] and not all(c == '_' for c in w):
                new_question.extend(split_question_and_underlinings(w))
            else:
                new_question.append(w.strip())
        lines.append(f'{i + 1}. {" ".join(new_question)}')
        lines.append(answers[i])
    return lines


def extract_questions(elements):
    questions = list()
    for element in elements:
        if element.text.strip():
            questions.append(element.text.strip())
    return questions


def extract_answers(elements):
    answer = list()
    for element in elements:
        if element.text.strip():
            for a in element.text.strip().split('\n'):
                answer.append(a.strip())
    return '; '.join(answer)


def extract_questions_and_answers(content):
    soup = BeautifulSoup(content, 'lxml').select('#page-content')[0].select('.content')

    questions = list()
    answers = list()

    for element in soup:
        questions.extend(extract_questions(element.select('.qtext')))
        answers.append(extract_answers(element.select('.answer')))

    return questions, answers


def main():
    with open(input('Введите путь к файлу первой страницы: ').strip(), 'r', encoding='utf-8') as file:
        content = file.read()

    questions, answers = extract_questions_and_answers(content)

    print('Choose a, b or c to fill the gaps. Write the answers each on new line in the format: n) letter. answer, '
          'where n is the question number, letter is a, b or c and answer is the associated with the letter answer that'
          'fits the gap best. NOTHING ELSE should be in the answer!')
    print(*pack_questions_with_answers(questions, answers), sep='\n')


if __name__ == '__main__':
    main()
