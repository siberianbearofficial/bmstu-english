from bs4 import BeautifulSoup


def extract_task_text(elements):
    task_text = list()
    for element in elements:
        if element.text.strip():
            task_text.append(element.text.strip())
    return task_text


def extract_blank_options(elements):
    blank_options = list()
    for option in elements:
        if option.text.strip():
            blank_options.append(option.text.strip())
    return blank_options


def extract_task_text_and_options(content):
    soup = BeautifulSoup(content, 'lxml')
    soup = soup.select('#page-content')[0].select('.content')

    task_text = list()
    blanks_options = list()
    ind = 0
    for el in soup:
        task_text.extend(extract_task_text(el.find_all('p')))
        for select_element in el.find_all('select'):
            blank_options = extract_blank_options(select_element.find_all('option'))
            blanks_options.append(f'[{ind + 1}: {", ".join(blank_options)}]')
            ind += 1

    return task_text, blanks_options


def format_blank(words, ind, blanks_options):
    blank = blanks_options[ind]
    return blank if all(c == '_' for c in words[-1]) else f'{blank} {words[-1].strip("_")}'


def pack_task_text_with_options(task_text, blanks_options):
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
                new_words.append(format_blank(in_blank, blank_index, blanks_options))
                blank_index += 1
                in_blank = list()
            else:
                new_words.append(word)
        new_task_text.append(' '.join(new_words))
    return new_task_text


def main():
    with open(input('Введите путь к файлу второй страницы: ').strip(), 'r', encoding='utf-8') as file:
        content = file.read()

    task_text, options = extract_task_text_and_options(content)
    new_task_text = pack_task_text_with_options(task_text, options)

    print('Choose the best word to fill the gap. Write the answers each on new line in the format: n. chosen_word, '
          'where n is the number of the blank and chosen_word is your choice. NOTHING ELSE should be in the answer!')
    print('\n'.join(new_task_text))


if __name__ == '__main__':
    main()
