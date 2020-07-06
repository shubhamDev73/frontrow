from essentials import is_empty, get_id, get_user_id, get_num, get_parent, get_time

def post_id(tag, comment=False):
    parent = get_parent(tag, lambda parent: parent.has_attr('href'))
    return int(parent['href'].split('=')[-1] if comment else parent['href'].split('/')[-2])

def extract_data(element):
    import re

    post = {
        "user": 0,
        "type": "post",
        "id": 0,
        "time": "",
        "text": "",
        "likes": 0,
        "shares": 0,
        "comments": [],
        "error": "",
    }

    liked = False
    post_type = ''
    post_index = 0
    comment_index = len(list(element.strings))
    for index, info in enumerate(element.strings):
        index -= post_index
        if index == 0:
            if info == "NEW ACTIVITY" or info == "OLDER":
                break
            post['user'] = get_user_id(info)
        elif index == 1:
            if info == " created a poll." or info == " shared his first post." or info == " shared her first post." or info == " shared a " or info == "." or info == " is with " or info.parent.name == "a" or info == " and ":
                if info.parent.name == "a":
                    print("Link: %s" % info.parent['href'])
                post_type += info
                post_index += 1
                continue
            if is_empty(info):
                post_index -= 2
                continue
            if post_type != '':
                if post_type == " created a poll.":
                    post['type'] = "poll"
                elif post_type == " shared his first post." or post_type == " shared her first post.":
                    post['type'] = "first"
                elif post_type == " shared a link.":
                    post['type'] = "link"
                elif post_type == " shared a post.":
                    post['type'] = "share"
                elif post_type[:8] == " is with":
                    post['type'] = "with"
            if get_parent(info, lambda tag: tag.has_attr("data-utime")):
                post_index -= 3
                post['id'] = post_id(info)
                post['time'] = get_time(info)
                continue
        elif index == 4:
            if post['time'] != '':
                continue
            post['id'] = post_id(info)
            post['time'] = get_time(info)
        elif index >= 5 and index <= comment_index:
            comments = info.split(' ')
            if len(comments) > 1 and comments[1][:7] == "comment":
                comment_index = index
                last_index = comment_index + 5
                text_index = 1
                current_parent = None
            else:
                if not liked:
                    try:
                        if info[0] == '+':
                            raise ValueError
                        post['likes'] = get_num(info)
                        liked = True
                        if post['text'][-8:] == "See more":
                            post['error'] += "See more present!!\n"
                    except:
                        parent = get_parent(info, lambda parent: parent.has_attr("data-testid") and parent['data-testid'] == "post_message" and not(parent.has_attr("aria-hidden") and parent['aria-hidden'] == "true"))
                        if parent and info != "See Translation":
                            if get_parent(info, lambda parent: parent.has_attr('class') and 'text_exposed_hide' in parent['class']) is None:
                                post['text'] += info if info[0] == ' ' or post['text'] == ''  or post['text'][-1] == '#' else (' ' + info)
        elif index == comment_index + 1:
            shares = info.split(' ')
            if len(shares) > 1 and shares[1][:5] == "share":
                post['shares'] = get_num(shares[0])
        elif index >= comment_index + 5:
            new_index = index - last_index
            if new_index == 0:
                if info == "Write a comment..." or re.match("Comment as ", info):
                    break
                elif info == "Write a reply..." or re.match("Reply as ", info) or is_empty(info) or info == "Edited" or re.match("Hide [\d,]+ replies", info) or info == "Press Enter to post." or info == "Comments" or info == "Share":
                    last_index = index + 1
                    text_index = 1
                    continue
                elif re.match("View [\d,]+ more", info) or re.match("View previous comments", info) or info == "Someone is typing a comment..." or info[-8:] == " replied":
                    post['error'] += "%s present!!\n" % info
                    break
                elif info == "Like" or info == "Love" or info == "Haha" or info == "Wow" or info == "Sad" or info == "Angry":
                    post['error'] += "Error: Please reload facebook webpage and try again\n"
                    break
                parent = get_parent(info, lambda parent: parent.has_attr('href'))
                id = get_id("https://www.facebook.com%s" % parent['href'])
                parent = get_parent(parent, lambda parent: parent.name == 'li' and len(list(parent.children)) == 2)
                reply = current_parent == parent
                if reply:
                    if not current_comment:
                        current_comment = comment
                else:
                    current_comment = None
                    current_parent = parent
                comment = {
                    "user": id,
                    "id": 0,
                    "time": None,
                    "text": "",
                    "likes": 0,
                    "replies": [],
                    "error": "",
                }
            elif new_index >= 1:
                if new_index - text_index == 1:
                    if comment['text'] == '':
                        comment['text'] = "<sticker>"
                    if comment['text'][-8:] == "See more":
                        comment['error'] += "Error: See more present!!\n"
                    if likes == "Manage":
                        last_index -= 1
                    else:
                        comment['likes'] = int(likes)
                elif new_index - text_index == 3:
                    if info != "Like":
                        last_index += 1
                elif new_index - text_index == 6:
                    if is_empty(info) or info == "See translation":
                        text_index += 1
                        continue
                    comment['time'] = get_time(info)
                    comment['id'] = post_id(info, True)
                    last_index = index + 1
                    text_index = 1
                    if reply:
                        current_comment['replies'].append(comment)
                    else:
                        post['comments'].append(comment)
                    reply = False
                else:
                    likes = info
                    if get_parent(info, lambda parent: parent.has_attr("class") and "_72vr" in parent['class']):
                        if not is_empty(info):
                            comment['text'] += info if info[0] == ' ' or comment['text'] == '' or comment['text'][-1] == '#' else (' ' + info)
                        text_index += 1
    return post

if __name__ == "__main__":
    import sys
    import json
    from bs4 import BeautifulSoup

    posts_to_extract = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    with open(sys.argv[1], encoding="utf-8") as f:
        soup = BeautifulSoup(f, 'html.parser')

    news_feed = soup.find(lambda tag: tag.has_attr("aria-label") and tag['aria-label'] == "News Feed")
    feed = news_feed.find(lambda tag: tag.has_attr("role") and tag['role'] == "feed")

    posts = []
    for post in feed.children:
        if posts_to_extract and len(posts) >= posts_to_extract:
            break
        if post.has_attr("role") and post['role'] == "article":
            posts.append(extract_data(post))
    for post in news_feed.children:
        if posts_to_extract and len(posts) >= posts_to_extract:
            break
        if post.has_attr("role") and post['role'] == "article":
            posts.append(extract_data(post))

    with open(sys.argv[2], "w", encoding="utf-8") if len(sys.argv) > 2 else sys.stdout as f:
        json.dump(posts, f, indent=4)
