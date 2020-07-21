ids = {}

def is_empty(tag):
    tag = tag.strip()
    return tag == '' or tag == '·' or tag == '•'

def get_id(link):
    import requests
    from bs4 import BeautifulSoup

    links = link.split('?')
    link = links[0]

    try:
        ids[link] = int(link.split('/')[-2].split('-')[-1])
        return ids[link]
    except:
        pass

    try:
        ids[link] = int(link.split('/')[-1])
        return ids[link]
    except:
        pass

    if links[1][:3] == "id=":
        return int(links[1].split('&')[0][3:])

    if link in ids:
        return ids[link]

    try:
        page = requests.post("https://lookup-id.com", data={"check": "Lookup", "fburl": link})
        ids[link] = int(BeautifulSoup(page.content, 'html.parser').find(id='code').text)
    except AttributeError:
        raise ConnectionError("Error extracting id from link. Try again")
    return ids[link]

def get_user_id(tag):
    parent = get_parent(tag, lambda tag: tag.has_attr('href'))
    return get_id(parent['href']) if parent else 0

def get_num(string):
    return int(string.replace(',', ''))

def get_parent(tag, tag_type):
    parent = tag.parent
    while parent:
        if isinstance(tag_type, str):
            if parent.name == tag_type:
                break
        else:
            if tag_type(parent):
                break
        parent = parent.parent
    return parent

def get_time(tag):
    from datetime import datetime

    parent = get_parent(tag, lambda tag: tag.has_attr("data-utime"))
    return str(datetime.fromtimestamp(int(parent['data-utime'])))

def get_date(string):
    from datetime import date
    import calendar
    def normalize(n):
        if isinstance(n, int):
            return normalize(str(n))
        if len(n) == 2:
            return n
        return "0%s" % n
    months = dict((v, k) for k, v in enumerate(calendar.month_abbr))
    strings = string.split(' ')
    return str(date.fromisoformat("%s-%s-%s" % (strings[2], normalize(months[strings[1][:3]]), normalize(strings[0]))))
