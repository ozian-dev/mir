import re
import pytz
import smtplib

from fastapi import Request
from datetime import datetime
from fastapi import Request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.conf import const
from app.util import util_file


###############################
# csv functions
###############################

def parse_csv_line(line:str) :

    line = line.replace('\ufeff', '')

    fm = '""'
    to = '&quot;'
    line = re.sub(fm, to, line)

    res_arr = []

    is_start = True
    mode = ''
    str = ''
    char_pre = ''
    for char in line:

        if is_start :

            if char == '"' :
                mode = 'quot'
                str = ''
                is_start = False
            elif char == ',' :
                res_arr.append('')
                str = ''
            else :
                mode = 'normal'
                str = char
                is_start = False

        else :

            if mode == 'quot' :
                if char == '"' :
                    pass
                elif char == ',' :
                    if char_pre == '"' :

                        fm = '&quot;'
                        to = '"'
                        str = re.sub(fm, to, str)

                        res_arr.append(str)
                        is_start = True
                        str = ''

                    else :
                        str += char
                else :
                    str += char
            
            elif mode == 'normal' :
                if char == ',' :
                    
                    fm = '&quot;'
                    to = '"'
                    str = re.sub(fm, to, str)
                    
                    res_arr.append(str)
                    is_start = True
                    str = ''               
                else :
                    str += char

        char_pre = char

    fm = '&quot;'
    to = '"'
    str = re.sub(fm, to, str)
    res_arr.append(str)

    return res_arr

###############################
# dict. functions
###############################


def get_obj (arr) :
        
    result = {}
    for item in arr:
        temp = result
        for i in range(len(item) - 2):
            if item[i] not in temp:
                temp[item[i]] = {}
            temp = temp[item[i]]
        temp[item[-2]] = f"{item[-1]}"
    
    return result

def get_arr(obj):
    def recurse(d, path):
        if isinstance(d, dict):
            for k, v in d.items():
                yield from recurse(v, path + [k])
        else:
            yield path + [d]
    
    return list(recurse(obj, []))

def exist_key (obj, keys):

    if not keys:
        return True
    key = keys[0]
    if key in obj: return exist_key (obj[key], keys[1:])
    else: return False

def get_vals_array (array, name):
    return [obj[name] for obj in array if name in obj]

def get_obj_array (array, key, val):
    
    for item in array:
        if item[key] == val : return item

    return None

def get_index_array (arry, key, val):
    
    return next((i for i, item in enumerate(arry) if item[key] == val), -1)


def shift_array_right(arr):
    if not arr:
        return arr
    last_element = arr.pop()
    arr.insert(0, last_element)
    return arr


###############################
# request & template functions
###############################

def is_mobile (request: Request) :
    user_agent = request.headers.get('User-Agent', "")
    mobile_keywords = ["Mobile", "Android", "iPhone", "iPad", "Opera Mini", "IEMobile"]    
    for keyword in mobile_keywords:
        if keyword in user_agent:
            return True
        
    return False

def get_css_os (request: Request) :
    os = "etc"
    user_agent = request.headers.get('user-agent', '').lower()
    if 'windows' in user_agent:
        os = "win"
    elif 'macintosh' in user_agent:
        os = "mac"
    elif 'android' in user_agent:
        os = "aos" 
    elif 'iphone' in user_agent or 'ipad' in user_agent:
        os = "ios" 
    return f"{const.PATH_TEMPLATE_STATIC}/css/os.{os}.css"

def get_css (request: Request, device) :

    css_common_file = f"{const.PATH_TEMPLATE_STATIC}/css/common.css"
    css_device_file = f"{const.PATH_TEMPLATE_STATIC}/css/device.{device}.css"
    css_customs = []

    if len(const.CONF["style"]["css"]) > 0 : 
        for css in const.CONF["style"]["css"] :
            if len(css) > 0 :
                css_customs.append(f"{const.PATH_CONF_CSS}/{css}")   
    else :
        cookie_device = request.cookies.get(const.CONF["app"]["name"] + ".d")
        if cookie_device is not None and cookie_device != "" :
            if cookie_device == "m" : css_device_file = f"{const.PATH_TEMPLATE_STATIC}/css/device.m.css"        
        else :
            if is_mobile (request) :
                css_device_file = f"{const.PATH_TEMPLATE_STATIC}/css/device.m.css"

    css_obj = {}
    css_obj["common"] = util_file.load_file(css_common_file)
    css_obj["device"] = util_file.load_file(css_device_file)
    css_obj["os"] = util_file.load_file(get_css_os(request))
    css_obj["custom"] = ""
    for css in css_customs:
        css_obj["custom"] += "\n"
        css_obj["custom"] += util_file.load_file(css)

    style = const.CONF["style"]["color"]
    css_obj["common"] = css_obj["common"].replace("{{{background_color_logo}}}",   const.STYLE[style]["main"])
    css_obj["common"] = css_obj["common"].replace("{{{background_color_header}}}", const.STYLE[style]["sub"])

    return css_obj

def get_js (request: Request) :

    js_obj = {}
    js_obj["init"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/init.js")
    js_obj["push"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/push.js")
    js_obj["event"]  = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/event.js")
    js_obj["play"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/play.js")
    js_obj["post"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/post.js")
    js_obj["form"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/form.js")
    js_obj["render"] = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/render.js")
    js_obj["table"]  = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/table.js")
    js_obj["util"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/util.js")
    js_obj["mobile"]   = util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/mobile.js")

    return js_obj

def get_client_ip (request: Request) :

    x_forwarded_for = request.headers.get("x-forwarded-for")
    x_real_ip = request.headers.get("x-real-ip")
    
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()
    elif x_real_ip:
        client_ip = x_real_ip.strip()
    else:
        client_ip = request.client.host
    
    return client_ip


###############################
# time functions
###############################


def get_time(format : str = None ) :

    timezone = pytz.timezone(const.CONF["timezone"])

    if format is None : return datetime.now(timezone)
    else : return datetime.now(timezone).strftime(format)

def get_timezone_offset(timezone_str):

    tz = pytz.timezone(timezone_str)
    now = datetime.now()
    local_time = tz.localize(now)
    offset = local_time.strftime('%z')
    
    return f"{offset[:3]}:{offset[3:]}"
    
"""
cron_expr: string in the format 'minute hour day month weekday'
now: a datetime object
"""
def match_cron_time(cron_expr):
    now = datetime.now()
    def match(value, field):
        if field == '*':
            return True
        for part in field.split(','):
            if '/' in part:
                base, step = part.split('/')
                base = int(base) if base != '*' else 0
                step = int(step)
                if (value - base) % step == 0:
                    return True
            elif '-' in part:
                start, end = map(int, part.split('-'))
                if start <= value <= end:
                    return True
            elif int(part) == value:
                return True
        return False

    fields = cron_expr.strip().split()
    if len(fields) != 5:
        raise ValueError("The Cron expression must consist of five fields: 'minute hour day month weekday'.")

    minute, hour, day, month, weekday = fields

    return (match(now.minute, minute) and
            match(now.hour, hour) and
            match(now.day, day) and
            match(now.month, month) and
            match(now.weekday(), weekday))  # monday: 0 ~ sunday: 6


###############################
# email functions
###############################

def send_email(subject, body, from_email, to_email):

    if 'smtp' not in const.CONF: 
        raise RuntimeError("smtp config error")
        
    smtp_server = const.CONF['smtp']['server']
    smtp_port = const.CONF['smtp']['port']
    smtp_account = const.CONF['smtp']['account']
    smtp_password = const.CONF['smtp']['password']

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html', _charset='utf-8'))

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=3) as server:
            server.login(smtp_account, smtp_password)
            server.send_message(msg)
            server.quit()
    except Exception as e:
        raise RuntimeError("email send error")
    