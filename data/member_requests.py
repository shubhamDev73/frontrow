from essentials import is_empty, get_id, get_num, get_parent, get_time, get_date

def get_answer(user, text, is_answer):
    user['member']['answer' if is_answer else 'question'].append(text)
    return not is_answer

def extract_data(request):
    import re

    user = {
        "id": 0,
        "name": "",
        "is_page": False,
        "type": "member",
        "join_time": "",
        "friends": 0,
        "groups": 0,
        "lives": "",
        "work": "",
        "study": "",
        "member": {
            "join_time": "",
            "question": [],
            "answer": [],
        }
    }

    group_index = 0
    work = ''
    work_li = None
    study = ''
    study_li = None
    img_class = ''
    work_has_question = False
    for index, info in enumerate(request.strings):
        index -= 3
        index -= group_index
        if index == 0:
            user['name'] = info
            user['id'] = get_id("https://www.facebook.com/%s" % info.parent['href'])
        elif index == 1:
            if info != "Requested ":
                print("Invited by: %s" % info[11:])
        elif index == 2:
            user['member']['join_time'] = get_time(info)
        elif index == 3:
            if is_empty(info):
                group_index += 1
                continue
            if re.match("[\d,]+ groups? in common", info):
                print("Groups in common: %d" % get_num(info.split(' ')[0]))
                group_index += 1
                continue
            if re.match("[\d,]+ friends? in group", info):
                print("Friends in group: %d" % get_num(info.split(' ')[0]))
                group_index += 1
                continue
            if re.match("[\d,]+ friends", info):
                user['friends'] = get_num(info.split(' ')[0])
                group_index += 1
                continue
            if info == "Joined Facebook on ":
                group_index -= 1
                continue
            infos = info.split(' ')
            groups = get_num(infos[0])
            if infos[1] == "other":
                groups += 1
            user['groups'] = groups
        elif index == 5:
            user['join_time'] = get_date(info)
        elif index == 6:
            if info != "Lives in ":
                work_li = get_parent(info, "li")
                work += info
                work_has_question = True
                group_index -= 1
                continue
        elif index == 7:
            user['lives'] = info
        elif index == 8:
            parent = get_parent(info, "li")
            if parent.has_attr("class") and "_-tv" in parent['class']:
                work_has_question = False
                img_class = next(parent.children)['class'][3]
                if work_li:
                    if study_li:
                        if parent == study_li:
                            study += info
                        else:
                            continue
                    else:
                        if parent == work_li:
                            work += info
                        else:
                            user['work'] = work
                            study_li = parent
                            study += info
                else:
                    work_li = parent
                    work += info
                group_index += 1
                continue
            else:
                if info[:29] == "Hasn't answered questions yet":
                    continue
                is_answer = False
                if work_has_question:
                    is_answer = get_answer(user, work, is_answer)
                is_answer = get_answer(user, info, is_answer)
        elif index == 9:
            is_answer = get_answer(user, info, is_answer)
            group_index += 1
            continue
    if not work_has_question and work != '':
        user['work' if img_class == 'sx_6dce7b' else 'study'] = work if study == '' else study
    return user

if __name__ == '__main__':
    import sys
    import json
    from bs4 import BeautifulSoup

    users_to_extract = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    with open(sys.argv[1],  encoding="utf-16") as f:
        soup = BeautifulSoup(f, 'html.parser')

    elements = next(soup.find(id="member_requests_pagelet").find(lambda tag: tag.has_attr("class") and '_7gi8' not in tag['class'] and '_4-u2' in tag['class'] and '_4-u8' in tag['class']).children).children

    print("Total requests: %d" % get_num(list(next(elements).stripped_strings)[0].split(' ')[0]))

    users = []
    for request in next(elements).find("ul").children:
        if users_to_extract and len(users) >= users_to_extract:
            break
        users.append(extract_data(request))

    with open(sys.argv[2], "w", encoding="utf-16") if len(sys.argv) > 2 else sys.stdout as f:
        json.dump(users, f, indent=4)
