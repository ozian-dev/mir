from fastapi import Request
from app.util import util_response, util_param

async def run(request: Request) :

    post = None
    if request.method == "POST" :
        post = await request.json()

    params = util_param.get_init_info(request, post, only_params = True)

    group = params[".g"]
    pid = params[".i"]
    msg = "hello"
    html = f"{params["@grp_name"]}_custom : hello<br/>posted data is below!!<br/><br/>{params}"
    entity = "form"

    return util_response.response_custom (group, pid, msg, html, entity)
