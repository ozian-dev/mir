import re
import inspect

from fastapi import HTTPException, Response
from urllib.parse import quote
from openpyxl import Workbook
from io import BytesIO

from app.util import util_library

def error ( msg: str ) : 
    res = {"status":"fail","msg":msg}
    return res

def error_notify (msg: str, code: int = 200 ) : 
    res = {"status":"ok","r_code":code,"msg":msg}
    return res

def error_exit ( msg: str ) : 
    res = {"status":"fail","msg":msg}
    return HTTPException(status_code=200, detail=res)

def response_custom(group, pid: int = -1, msg: str="", html: str = "", entity: str = ""):
    calling_frame = inspect.currentframe().f_back
    call_name = calling_frame.f_globals["__name__"].split('.')[-1]

    # to get a function, follow the steps below
    # call_name = calling_frame.f_code.co_name
    
    return {"status":"ok","grp":group,"pid":pid, "entity":entity, "type":"custom","name":call_name,"msg":msg,"html":html}


def response_excel(data):

    workbook = Workbook()
    worksheet = workbook.active

    invalid_chars = ['\\', '/', '*', '?', ':', '"', '<', '>', '|']
    excel_title = data["title"]
    for char in invalid_chars: excel_title = excel_title.replace(char, '_')
    worksheet.title = excel_title

    heads = []
    for head in data["chart"]["heads"]:
        head_name = head['name']
        if 'alias' in head : head_name = head['alias']
        heads.append(head_name)

    worksheet.append(heads)

    for row in data["chart"]["values"] :
        worksheet.append(row)
   
    excel_file = BytesIO()
    workbook.save(excel_file)
    excel_file.seek(0)

    formatted_time = util_library.get_time(".%y%m%d.%H%M%S")
    title = quote (re.sub(r'\W+', '_', data["title"].strip()) + formatted_time)

    response = Response(content=excel_file.getvalue())
    response.headers["Content-Disposition"] = f'attachment; filename="{title}.xlsx"'
    response.headers["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8"
    response.headers["Content-Transfer-Encoding"] = "binary"

    excel_file.close()
    return response


def response_csv(data):

    csv_data = ""
    if "values" in data["chart"] : 
        csv_data = generate_csv_data(data)

    formatted_time = util_library.get_time(".%y%m%d.%H%M%S")
    title = quote (re.sub(r'\W+', '_', data["title"].strip()) + formatted_time)

    response = Response(content=csv_data)
    response.headers["Content-Disposition"] = f'attachment; filename="{title}.csv"'
    response.headers["Content-Type"] = "application/octet-stream; charset=utf-8"
    response.headers["Content-Transfer-Encoding"] = "binary"

    return response

def add_quote(s):
    s = str(s)
    s = s.replace('"', '""')
    return f'"{s}"'

def generate_csv_data(data):

    delimiter = ","
    csv_data = "\ufeff"
 
    # Write CSV header
    headers = util_library.get_vals_array (data["chart"]["heads"], "name")
    csv_data += delimiter.join(headers) + "\n"

    # Write CSV rows
    for row in data["chart"]["values"]:
        row_values = []
        for v in row:
            this_val = v["v"] if isinstance(v, dict) else v
            row_values.append(add_quote(this_val))
        csv_data += delimiter.join(row_values) + "\n"

    return csv_data.encode("utf-8")


