import re

from essentials import is_empty, get_user_id, get_num, get_parent, get_time, get_date

def extract_data(data):
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
    }

    printed_user = False
    for info in data.strings:
        if not printed_user:
            if info == "Message" or info == "3-dots-h":
                continue
            user['name'] = info
            user['id'] = get_user_id(info)
            printed_user = True
        else:
            if is_empty(info):
                continue
            if get_parent(info, "a"):
                user_type = info.lower()
                if user_type in ['admin', 'moderator', 'creator']:
                    user['type'] = user_type
                continue
            if info.parent.has_attr("class") and 'timestampContent' in info.parent['class']:
                user['join_time'] = get_time(info)
                continue
            else:
                if re.match("[\d,]+ people like this.", info):
                    user['friends'] = get_num(info.split(' ')[0])
                    continue
                if is_empty(info[:3]):
                    # print(info[3:].capitalize())
                    continue
                if info[:9] == "Added by " or info[:17] == "Created group on ":
                    infos = info.split(' on ')
                    if len(infos) > 1:
                        user['join_time'] = get_date(infos[1])
                    else:
                        return None # Added by .... yesterday
                    if infos[0] == "Created group":
                        user['type'] = "creator"
                    # else:
                    #     print("Added by: %s" % infos[0].replace("Added by ", ''))
                    continue
                page_symbol = next(info.parent.parent.children)
                user['is_page'] = page_symbol != info and page_symbol.has_attr("class") and '_gph' in page_symbol['class']
                if user['is_page']:
                    user['work'] = info
    return user

if __name__ == '__main__':
    import sys
    import json
    from bs4 import BeautifulSoup

    users_to_extract = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    with open(sys.argv[1], encoding="utf-8") as f:
        soup = BeautifulSoup(f, 'html.parser')

    total_members = get_num(next(soup.find(id="groupsMemberBrowser").children).text.replace("Members", ''))
    # print("Total members: %d" % total_members)

    members_container = soup.find(id="groupsMemberBrowserContent")

    users = []
    for members in members_container.children:

        member_type = members['id'].replace("groupsMemberSection_", '')

        if member_type == "all_members":
            all_elements = members.find_all(class_="fbProfileBrowserList")
            all_members = []
            for element in all_elements:
                all_members += list(element.find("ul").children)

            for member in all_members:
                if users_to_extract and len(users) >= users_to_extract:
                    break
                extracted_user = extract_data(member)
                if extracted_user and extracted_user['id'] != 0:
                    users.append(extracted_user)

    with open(sys.argv[2], "w", encoding="utf-8") if len(sys.argv) > 2 else sys.stdout as f:
        json.dump(users, f, indent=4)
