import json
import time

#import google.generativeai as genai
from google import genai
from google.genai.types import GenerateContentConfig

from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse, JSONResponse

from app.conf import const
from app.util import util_db


def startAgent(data, params):

    prompt_json = getAgentInfo(data["chart"]["agent"]["source"], params['@level'])

    const.CHAT_USER[params['@id']] = {}
    params['data'] = data
    user_prompt = util_db.get_parsed_query(prompt_json['user'], params)
    system_prompt = util_db.get_parsed_query(prompt_json['system'])

    """   
    # just for LLM test
    user_prompt = 'hi'
    system_prompt = f"What is the date today? Please answer in {const.CONF['locale']['lang']}."
    prompt_json['llm']['source'] = 'google'
    prompt_json['llm']['name'] = 'gemini-2.5-flash'
    """ 

    llm = prompt_json['llm']['source']
    model = prompt_json['llm']['name']

    if llm == 'google' :
        client = genai.Client(api_key=const.CONF['keys'][f'llm_{llm}'])
        const.CHAT_USER[params['@id']][llm] = client.chats.create(
            model = model,
            config = GenerateContentConfig(
                system_instruction = system_prompt,
                temperature = 0
            )
        )

        async def generate_response():
            
            """   
            # just for FE test
            time.sleep(2) 
            msg_arr = [
                "Hey! Long time no see. How have you been?\n\n",
                "Oh, hey Camila! I’ve been good. How about you?\n\n",
            ]
            for msg in msg_arr:
                yield f"data: {json.dumps({'type': 'token', 'content': msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            """
            
            try:
                for chunk in const.CHAT_USER[params['@id']][llm].send_message_stream(user_prompt):
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    else:
        return None

def chatAgent(info, params):

    prompt_json = getAgentInfo(info['source'], params['@level'])
    system_prompt = prompt_json['system']
    user_prompt = params['prompt']

    llm = prompt_json['llm']['source']
    model = prompt_json['llm']['name']

    if llm == 'google' :
        client = genai.Client(api_key=const.CONF['keys'][f'llm_{llm}'])
        if params['@id'] not in const.CHAT_USER:
            const.CHAT_USER[params['@id']] = {}
            const.CHAT_USER[params['@id']][llm] = client.chats.create(
                model = model,
                config = GenerateContentConfig(
                    system_instruction = system_prompt,
                    temperature = 0
                )
            )

        async def generate_response():
            
            """
            # just for FE test
            time.sleep(2) 
            msg_arr = [
                "Hey! Long time no see. How have you been?\n\n",
                "Oh, hey Camila! I’ve been good. How about you?\n\n",
                "Work’s been a bit busy, but I went on a trip over the weekend.\n\n",
                "Wow, where did you go?\n\n",
                "Maldives! I saw the ocean and relaxed. Want to go together next time?\n\n",
                "Sounds great! I’m in anytime.\n\n",
            ]
            for msg in msg_arr:
                yield f"data: {json.dumps({'type': 'token', 'content': msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            """

            try:
                for chunk in const.CHAT_USER[params['@id']][llm].send_message_stream(user_prompt):
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    else:
        None

def getAgentInfo(source, level):

    params = {
        'idx': int(source),
        '@level': level,
    }
    prompt_res = util_db.select_db(const.CONF["start_db"]["idx"], const.SQLS["prompt"], params)
    if len(prompt_res['data']) == 0:
        raise (Exception('prompt source is not valid'))
    
    else:
        prompt_json = json.loads(prompt_res['data'][0]['json_prompt_value'])
        final_res = {}
        final_res['status'] = 'ok'
        final_res['data'] = {}
        final_res['data']['source'] = prompt_json['llm']['source']
        final_res['data']['name'] = prompt_json['llm']['name']

        checkKeys(final_res['data']['source'])

        return prompt_json


def checkKeys(llm):
    source = f"llm_{llm}"
    if source not in const.CONF['keys']:
        raise (Exception(f"no LLM key: {llm}"))
