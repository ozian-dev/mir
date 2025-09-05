import os
import json
import time
import shutil

#import google.generativeai as genai
from google import genai
from google.genai import types
from google.genai.types import GenerateContentConfig

from fastapi.responses import StreamingResponse

from app.conf import const
from app.util import util_db, util_file


def startAgent(data, params, mode: str = 'stream'):

    prompt_json = getAgentInfo(int(params['pmtidx']), params['@level'])
    params['data'] = {}
    params['data']['info'] = data['info'] if 'info' in data else {}
    params['data']['heads'] = data['chart']['heads']
    params['data']['values'] = data['chart']['values']
    
    llm = prompt_json['llm']['source']
    model = prompt_json['llm']['name']

    dir_path = util_file.make_directory (f"{const.PATH_DATA_SESSION}/{params['@id']}/{llm}/{params['.i']}")
    session_history_file = f"{dir_path}/history.json"
    session_data_file = f"{dir_path}/data.json"
    util_file.write_json_file (params['data'], session_data_file)

    user_prompt = util_db.get_parsed_query(prompt_json['user'], params)
    system_prompt = util_db.get_parsed_query(prompt_json['system'], params)

    """
    # just for LLM test
    user_prompt = 'hi! how are you'
    system_prompt = f"What is the date today? Please answer in {const.CONF['locale']['lang']}."
    llm = 'google'
    """

    if llm == 'google' :

        client = genai.Client(api_key=const.CONF['keys'][f'llm_{llm}'])
        chat = client.chats.create(
            model = model,
            config = GenerateContentConfig(
                system_instruction = system_prompt,
                temperature = 0
            )
        )
 
        parts = []
        file_obj = client.files.upload(
            file=session_data_file,
            config={'mimeType': 'text/plain'}
        )
        parts.append(user_prompt)
        parts.append(file_obj)

        file_status = str(client.files.get(name=file_obj.name).state)
        if file_status.lower() != 'filestate.active' :
            time.sleep(1)
        
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
                response_stream = chat.send_message_stream(parts)
                full_answer = ''
                for chunk in response_stream:
                    if chunk.text:
                        full_answer += chunk.text
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"

                yield f"data: {json.dumps({'type': 'done'})}\n\n"

                init_session(session_history_file, system_prompt, parts, full_answer)

            except Exception as e:
                print(e)
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        
        if mode == 'stream' :
            return StreamingResponse(
                generate_response(),
                media_type='text/plain',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Content-Type': 'text/event-stream',
                }
            )
        else:
            response = chat.send_message(parts)
            answer = response.text if hasattr(response, 'text') else str(response)
            res_answer = {
                'source': prompt_json['llm']['source'],
                'name': prompt_json['llm']['name'],
                'title': prompt_json['title'],
                'answer': answer,
            }
            return res_answer

    else:
        return None

def chatAgent(info, params):

    prompt_json = getAgentInfo(info['source'], params['@level'])
    user_prompt = params['prompt']

    llm = prompt_json['llm']['source']
    model = prompt_json['llm']['name']

    dir_path = util_file.make_directory (f"{const.PATH_DATA_SESSION}/{params['@id']}/{llm}/{params['.i']}")
    session_history_file = f"{dir_path}/history.json"
    session_history = load_session(session_history_file) 
    session_history['chat_history'].append(types.ModelContent(parts=[types.Part(text=user_prompt)]))

    if llm == 'google' :
        client = genai.Client(api_key=const.CONF['keys'][f'llm_{llm}'])
        chat = client.chats.create(
            model = model,
            history=session_history['chat_history'],
            config = GenerateContentConfig(
                system_instruction = session_history['system_instruction'],
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
                response_stream = chat.send_message_stream(user_prompt)
                full_answer = ''
                for chunk in response_stream:
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"
                        full_answer += chunk.text
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

                chat_history = []
                chat_history.append({'role': 'user', 'text': user_prompt})
                chat_history.append({'role': 'assistant', 'text': full_answer})
                append_session(session_history_file, chat_history)

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

        return StreamingResponse(
            generate_response(),
            media_type='text/plain',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Content-Type': 'text/event-stream',
            }
        )
    else:
        None

def getAgentInfo(source, level):

    params = {
        'idx': int(source),
        '@level': level,
    }
    prompt_res = util_db.select_db(const.CONF['start_db']['idx'], const.SQLS['prompt'], params)
    if len(prompt_res['data']) == 0:
        raise (Exception('prompt source is not valid'))
    
    else:
        prompt_json = json.loads(prompt_res['data'][0]['json_prompt_value'])
        prompt_json['title'] = prompt_res['data'][0]['title']
        final_res = {}
        final_res['status'] = 'ok'
        final_res['data'] = {}
        final_res['data']['title'] = prompt_json['title']
        final_res['data']['source'] = prompt_json['llm']['source']
        final_res['data']['name'] = prompt_json['llm']['name']

        check_keys(final_res['data']['source'])

        return prompt_json

def check_keys(llm):
    source = f"llm_{llm}"
    if source not in const.CONF['keys']:
        raise (Exception(f"no LLM key: {llm}"))

def clear_session(params):
    param = {
        'idx': int(params['idx']),
        '@level': params['@level'],
    }
    prompt_res = util_db.select_db(const.CONF['start_db']['idx'], const.SQLS['prompt'], param)
    if len(prompt_res['data']) != 0:
        json_obj = json.loads(prompt_res['data'][0]['json_prompt_value'])
        llm = json_obj['llm']['source']
        dir_path = f"{const.PATH_DATA_SESSION}/{params['@id']}/{llm}/{params['.i']}"
        if os.path.exists(dir_path): shutil.rmtree(dir_path)

def init_session(session_history_file, system_instruction, parts, answer):

    if hasattr(parts[1], 'name'):
        safe_file = {
            'name': parts[1].name,
            'mimeType': getattr(parts[1], 'mime_type', None),
            'uri': getattr(parts[1], 'uri', None)
        }
    elif isinstance(parts[1], dict):
        safe_file = parts[1]
    elif parts[1] is None:
        safe_file = None
    else:
        safe_file = str(parts[1])

    chat_history = []

    chat = {}
    chat['role'] = 'user'
    chat['parts'] = []
    chat['parts'].append({'text': parts[0]})
    chat['parts'].append({'file_data':safe_file})
    chat_history.append(chat)
    
    chat = {}
    chat['role'] = 'assistant'
    chat['text'] = answer
    chat_history.append(chat)

    session_data = {
        'system_instruction': system_instruction,
        'chat_history': chat_history
    }
    with open(session_history_file, 'w', encoding='utf-8') as f:
        json.dump(session_data, f, ensure_ascii=False, indent=2)

def append_session(session_history_file, chat_history):
    if os.path.exists(session_history_file):
        with open(session_history_file, 'r', encoding='utf-8') as f:
            json_obj = json.load(f)
            json_obj['chat_history'].extend(chat_history)

        with open(session_history_file, 'w', encoding='utf-8') as f:
            json.dump(json_obj, f, ensure_ascii=False, indent=2)

def load_session(session_history_file):
    if os.path.exists(session_history_file):
        with open(session_history_file, 'r', encoding='utf-8') as f:
            json_obj = json.load(f)
            json_obj['chat_history'] = convert_chat_history(json_obj['chat_history'])
            return json_obj
    return {'system_instruction':'', 'chat_history': []}

def convert_chat_history(chat_history):
    sdk_history = []
    for msg in chat_history:
        parts = []
        if "parts" in msg:
            for p in msg["parts"]:
                if "text" in p and p["text"]:
                    parts.append(types.Part(text=p["text"]))
                elif "file_data" in p:
                    fd = p["file_data"]
                    parts.append(
                        types.Part.from_uri(
                            file_uri=fd["uri"],
                            mime_type=fd["mimeType"]
                        )
                    )
            sdk_history.append(types.UserContent(parts=parts))

        elif "text" in msg and msg["text"]:
            sdk_history.append(types.ModelContent(parts=[types.Part(text=msg["text"])]))

    return sdk_history