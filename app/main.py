"""
pkill -f "uvicorn.*app.main:app.*--port.*7000"
python -m uvicorn app.main:app --workers 3 --log-config ./ini/log.ini --port 7000
"""
import time
import os
import io
import sys
import json
import traceback
import asyncio
import logging

from fastapi import FastAPI, Request, Response, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app import watcher
from app.conf import const, log
from app.router import api, auth, rest, check, custom, user, file
from app.util import util_auth, util_library, util_file
from app.job import run

const.make_env()
app = FastAPI()
template = Jinja2Templates(directory=const.PATH_TEMPLATE)
file_observer = None

@app.on_event("startup") 
def startup_event():
    app.mount("/" + const.ALIAS_STATIC, StaticFiles(directory=const.PATH_TEMPLATE_STATIC), name=const.ALIAS_STATIC)
    
    global file_observer
    file_observer = watcher.start_file_watcher(const.FILE_CONF, const.load_conf)

    args = sys.argv
    const.APP_PORT = int(args[args.index("--port") + 1]) if "--port" in args else None
    const.APP_PID = os.getpid()

    const.SCHEDULER = AsyncIOScheduler()
    const.SCHEDULER.add_job(run.every_hour, 'cron', minute=0)
    const.SCHEDULER.add_job(run.every_minute, 'cron', minute='*')
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    
    const.ASYNC_LOOP =  asyncio.get_running_loop()
    const.SCHEDULER.start()
    run.every_hour()

@app.on_event("shutdown") 
def shutdown_event(): 
    global file_observer
    if file_observer:
        file_observer.stop()
        file_observer.join()

@app.middleware("http")
async def add_process_prework(request: Request, call_next):

    path = request.url.path
    query_params = dict(request.query_params)

    last_visit_group = request.cookies.get("mir.v.g")
    if last_visit_group == None : last_visit_group = 1
    group = query_params.get('.g', last_visit_group)

    is_allow = False
    for allow in const.ENV["path_allows"]:
        if ( path.startswith(allow) ) :
            is_allow = True
            break

    if ( is_allow == False ) :
        is_login = util_auth.is_login(group, request.cookies)
        if (is_login) :
            pass
        else :
            log.log_error('audit', "login check error\t" + str(request.cookies))
            content_type = ""
            if "Content-Type" in request.headers: 
                content_type = request.headers["Content-Type"]
            if path != "/":
                raise (Exception("Auth Error"))
            else:
                url = f"/login?.g={group}"
                return RedirectResponse(url=url, status_code=303)
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-server-duration"] = str(process_time)

    # last visited group
    response.set_cookie(key="mir.v.g", value=group, domain=request.base_url.hostname, httponly=False)

    return response

@app.get("/")
@app.get("/index.html")
async def root(request: Request, response: Response):
    device = "m" if util_library.is_mobile(request) else "p"
    css_obj = util_library.get_css(request, device)
    js_obj = util_library.get_js(request)
    js_obj = util_library.get_js(request)

    const.CONF["locale"]["lang_js"] = \
        util_file.load_file (f"{const.PATH_TEMPLATE_STATIC}/js/lang/{const.CONF['locale']['lang']}.js")

    return template.TemplateResponse("index.html",{"app":const.CONF["app"], "locale":const.CONF["locale"], "cookie":const.APP_NAME, "request":request, "device":device, "css":css_obj, "js_obj":js_obj})

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    if "favicon" in const.CONF["style"]:
        return FileResponse(f"{const.CONF["style"]["favicon"]}/favicon.ico")

    return FileResponse("./app/template/favicon.ico")

@app.get("/favicon.png", include_in_schema=False)
async def favicon():
    if "favicon" in const.CONF["style"]:
        return FileResponse(f"{const.CONF["style"]["favicon"]}/favicon.png")
    return FileResponse("./app/template/favicon.png")

@app.get("/login")
async def login(request: Request):
    color = const.STYLE[const.CONF["style"]["color"]]["sub"]
    return template.TemplateResponse("login.html",{"app":const.CONF["app"], "cookie":const.APP_NAME, "request":request, "color":color})


@app.exception_handler(Exception)
async def exception_handler(request, exc):
    output = io.StringIO()
    traceback.print_exc(file=output)
    traceback_str = output.getvalue()
    output.close()
    current_file = os.path.dirname(__file__)

    prefix = ""
    error_lines = []
    for line in traceback_str.split("\n"):
        if "Error:" in line : prefix = line[0:line.find("Error:")+6] + " "

        if current_file in line:
            tmp_str = line.strip().rstrip().replace(current_file, "") + "  "
            tmp_str = tmp_str.replace("File ", "")
            tmp_str = tmp_str.replace("\"", "'")
            error_lines.append(tmp_str)

    response = {
        "status": "fail",
        "msg": prefix + str(exc),
        "traceback": "   ".join(error_lines)
    }
    return JSONResponse(content=response, status_code=200)


app.include_router(auth.router, prefix="/auth")
app.include_router(api.router, prefix="/api")
app.include_router(rest.router, prefix="/rest")
app.include_router(check.router, prefix="/check")
app.include_router(user.router, prefix="/user")
app.include_router(file.router, prefix="/file")
app.include_router(custom.router, prefix="/custom")





# web socket server
@app.websocket("/ws/{user}")
async def websocket_endpoint(websocket: WebSocket, user: str = "anonymous"):

    client_host = websocket.client.host
    client_port = websocket.client.port
    client_id = f"{client_host}:{client_port}"

    if user in const.WS_USER and client_id in const.WS_USER[user]:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    await websocket.send_text( json.dumps({"status":"hello", "cid":client_id, "msg":f"hello! {user}"}) )
    if user not in const.WS_USER : const.WS_USER[user] = {}
    const.WS_USER[user][client_id] = websocket

    try:
        while True:
            msg = await websocket.receive_text()

    except WebSocketDisconnect:
        del const.WS_USER[user][client_id]
