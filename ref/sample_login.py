
from fastapi import Request

async def run(request: Request) :

    res = {"status": "ok", "data": {"id": "sky", "nation": "kr", "language": "ko", "uid": 12345, "level": "0110"}}
    return res
