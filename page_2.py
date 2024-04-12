from bs4 import BeautifulSoup


def only_underlinings(w):
    for c in w:
        if c != '_':
            return False
    return True


def main():
    def format_blank(words, ind):
        blank = blanks_options[ind]
        return blank if only_underlinings(words[-1]) else f'{blank} {words[-1].strip("_")}'

    with open(input('Введите путь к файлу второй страницы: ').strip(), 'r', encoding='utf-8') as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, 'lxml')
    soup = soup.select('#page-content')[0].select('.content')

    task_text = list()
    blanks_options = list()
    ind = 0
    for el in soup:
        for p_element in el.find_all('p'):
            if p_element.text.strip():
                task_text.append(p_element.text.strip())
        for select_element in el.find_all('select'):
            blank_options = list()
            for option in select_element.find_all('option'):
                if option.text.strip():
                    blank_options.append(option.text.strip())
            blanks_options.append(f'[{ind + 1}: {", ".join(blank_options)}]')
            ind += 1

    blank_index = 0
    new_task_text = list()
    for par in task_text:
        words = par.strip().split()
        new_words = list()

        in_blank = list()
        blank_started = False
        for word in words:
            if word and word[0].isdigit() and 'Blank' in word:
                blank_started = True
            elif blank_started and '__' not in word:
                in_blank.append(word)
            elif blank_started and '__' in word:
                in_blank.append(word)
                blank_started = False
                new_words.append(format_blank(in_blank, blank_index))
                blank_index += 1
                in_blank = list()
            else:
                new_words.append(word)
        new_task_text.append(' '.join(new_words))

    print('Choose the best word to fill the gap. Write the answers each on new line in the format: n. chosen_word, '
          'where n is the number of the blank and chosen_word is your choice. NOTHING ELSE should be in the answer!')
    print('\n'.join(new_task_text))


if __name__ == '__main__':
    main()
