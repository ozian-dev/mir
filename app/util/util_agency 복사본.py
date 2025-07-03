import json

#import google.generativeai as genai
from google import genai
from google.genai.types import GenerateContentConfig

from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse, JSONResponse

from app.conf import const
from app.util import util_db


def getReportGemini(data, params):

    params['idx'] = 1
    
    prompt_res = util_db.select_db(const.CONF["start_db"]["idx"], const.SQLS["prompt"], params)
    prompt_json = json.loads(prompt_res["data"][0]["json_prompt_value"])
    user_prompt = util_db.get_parsed_query(prompt_json['user'], {'data': data})

    
    if const.CHAT_USER :
        pass




    genai.configure(api_key=const.CONF['keys']['gemini'])
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        system_instruction=prompt_json['system'],
        generation_config= {
            "temperature": 0.0,
        }
    )
    
    async def generate_response():
        try:
            response = model.generate_content(user_prompt, stream=True)
            
            for chunk in response:
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


def chat(question:str, params):

    model = genai.GenerativeModel("gemini-2.5-flash")
    # ChatSession for preserving chat history
    chat = model.start_chat(history=[])  

    async def generate_response():
        try:
            response = chat.send_message(
                question,
                stream=True
            )

            for chunk in response:
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
    