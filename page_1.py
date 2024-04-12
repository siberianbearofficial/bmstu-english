from bs4 import BeautifulSoup


def only_underlinings(w):
    for c in w:
        if c != '_':
            return False
    return True


def main():
    with open(input('Введите путь к файлу первой страницы: ').strip(), 'r', encoding='utf-8') as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, 'lxml')
    soup = soup.select('#page-content')[0].select('.content')

    questions = list()
    answers = list()

    for el in soup:
        for element in el.select('.qtext'):
            if element.text.strip():
                questions.append(element.text.strip())
        answer = list()
        for element in el.select('.answer'):
            if element.text.strip():
                for a in element.text.strip().split('\n'):
                    answer.append(a.strip())
        answers.append('; '.join(answer))

    print('Choose a, b or c to fill the gaps. Write the answers each on new line in the format: n) letter. answer, '
          'where n is the question number, letter is a, b or c and answer is the associated with the letter answer that'
          'fits the gap best. NOTHING ELSE should be in the answer!')
    for i in range(len(questions)):
        q = questions[i]
        new_q = list()
        for w in q.strip().split():
            if '_' in q and not only_underlinings(w):
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
                if start_count:
                    new_q.append(start_count * '_')
                new_q.append(w.strip('_'))
                if end_count:
                    new_q.append(end_count * '_')
            else:
                new_q.append(w.strip())
        print(i + 1, ' '.join(new_q))
        print(answers[i])


if __name__ == '__main__':
    main()
