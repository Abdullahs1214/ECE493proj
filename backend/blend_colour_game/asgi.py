import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "blend_colour_game.settings")

import django
django.setup()

from django.core.asgi import get_asgi_application
from websockets.room_consumer import websocket_application

django_application = get_asgi_application()


async def application(scope, receive, send):
  if scope["type"] == "websocket":
    await websocket_application(scope, receive, send)
    return

  await django_application(scope, receive, send)