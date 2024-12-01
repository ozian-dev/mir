
from fastapi import APIRouter, Request, Response, Depends
from fastapi.responses import RedirectResponse
from urllib.parse import quote

from app.conf import log, const
from app.util import util_auth, util_cipher, util_library

router = APIRouter()

@router.post("/login")
async def login( request: Request,
                 response: Response,
                 logger = Depends(log.get_logger)
                ) :
    
    ip = util_library.get_client_ip(request)
    data = await request.form()

    request_info = {}
    request_info["id"] = data.get('id')
    request_info["pwd"] = data.get('pwd')
    request_info["grp"] = data.get('grp')
    request_info["u"] = data.get('u')
    if request_info["u"] is None or request_info["u"] == '': request_info["u"] = f"/?.g={request_info['grp']}"

    if request_info["grp"] is None : 
        return RedirectResponse(url="/login", status_code=303)
    
    grp = int(request_info["grp"])
    params = { "id":request_info["id"], "pwd":request_info["pwd"] }

    login_res = await util_auth.check_login(grp, params)

    if login_res is False :
        
        log_obj = { "@id":request_info['id'], "@level":"", "@grp":request_info['grp'], "@ip":ip, "login":"login_fail" }
        util_library.log(logger, log_obj)
        
        html = "<script>alert('incorrect id or password, please check again');history.go(-1)</script>"
        return Response(content=html)

    enc_info_str = util_cipher.encrypt_json(login_res)
    host_name = request.base_url.hostname

    response = RedirectResponse(url=request_info['u'], status_code=303)     

    print ( f"{const.APP_NAME}.{request_info['grp']}.i")
    
    response.set_cookie(key=f"{const.APP_NAME}.{request_info['grp']}.i", value=quote(login_res['id']), domain=host_name, httponly=False)
    response.set_cookie(key=f"{const.APP_NAME}.{request_info['grp']}.l", value=login_res['level'], domain=host_name, httponly=False)
    response.set_cookie(key=f"{const.APP_NAME}.{request_info['grp']}.n", value=quote(login_res['grp_name']), domain=host_name, httponly=False)
    response.set_cookie(key=f"{const.APP_NAME}.{request_info['grp']}.e", value=quote(enc_info_str), domain=host_name, httponly=True)
    
    response.set_cookie(key=f"{const.APP_NAME}.l.g", value=request_info["grp"], domain=host_name, httponly=False)

    log_obj = { "@id":login_res['id'], "@level":login_res['level'], "@grp":request_info['grp'], "@ip":ip, "login":"login_ok" }
    util_library.log(logger, log_obj)

    return response 

@router.get("/logout")
async def menu (request: Request, response: Response) :

    query_params = dict(request.query_params)
    grp = query_params.get('.g', 1)
    url = f"/login?.g={grp}"

    host_name = request.base_url.hostname

    response = RedirectResponse(url=url, status_code=303)
    response.set_cookie(key=f"{const.APP_NAME}.{grp}.l", expires=-1, value='', domain=host_name, httponly=False)
    response.set_cookie(key=f"{const.APP_NAME}.{grp}.e", expires=-1, value='', domain=host_name, httponly=True)
    
    return response 




